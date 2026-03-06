import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ComponentInput {
  tempId: string;
  parentTempId: string; // "product" для прямых потомков изделия
  existingId?: string; // если выбрана существующая позиция
  name: string;
  type: string; // ItemType id
  unit: string;
  description?: string;
  pricePerUnit?: number;
  quantity: number;
  stockQuantity?: number;
  isPaired?: boolean;
}

interface ProductCreateInput {
  product: {
    name: string;
    unit: string;
    description?: string;
  };
  isPaired?: boolean;
  components: ComponentInput[];
}

export async function POST(request: Request) {
  let body: ProductCreateInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
  }

  const { product, components, isPaired } = body;

  if (!product.name?.trim()) {
    return NextResponse.json({ error: "Название изделия обязательно" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (isPaired) {
        return await createPairedProducts(tx, product, components);
      } else {
        return await createSingleProduct(tx, product, components);
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("product-create error:", err);
    const message = err instanceof Error ? err.message : "Ошибка при создании";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSingleProduct(tx: any, product: ProductCreateInput["product"], components: ComponentInput[]) {
  const idMap = new Map<string, string>();

  const created = await tx.item.create({
    data: {
      id: crypto.randomUUID(),
      name: product.name.trim(),
      typeId: "product",
      unitId: product.unit || "pcs",
      description: product.description || null,
      images: [],
    },
  });
  idMap.set("product", created.id);

  for (const comp of components) {
    let itemId: string;
    if (comp.existingId) {
      itemId = comp.existingId;
    } else {
      const item = await tx.item.create({
        data: {
          id: crypto.randomUUID(),
          name: comp.name.trim(),
          typeId: comp.type,
          unitId: comp.unit || "pcs",
          description: comp.description || null,
          images: [],
          pricePerUnit: comp.pricePerUnit ?? null,
        },
      });
      itemId = item.id;
    }
    idMap.set(comp.tempId, itemId);
  }

  let bomCount = 0;
  for (const comp of components) {
    const childId = idMap.get(comp.tempId);
    const parentId = idMap.get(comp.parentTempId);
    if (!childId || !parentId) continue;

    await tx.bomEntry.upsert({
      where: { parentId_childId: { parentId, childId } },
      update: { quantity: comp.quantity },
      create: { parentId, childId, quantity: comp.quantity },
    });
    bomCount++;
  }

  for (const comp of components) {
    if (comp.stockQuantity && comp.stockQuantity > 0) {
      const itemId = idMap.get(comp.tempId);
      if (itemId) {
        await tx.stockMovement.create({
          data: {
            type: "supplier_income",
            itemId,
            quantity: comp.stockQuantity,
            comment: "Начальный остаток (конструктор)",
          },
        });
      }
    }
  }

  return { productId: created.id, itemCount: components.length + 1, bomCount };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPairedProducts(tx: any, product: ProductCreateInput["product"], components: ComponentInput[]) {
  const sides = [
    { suffix: " левое", blankSuffix: " левая" },
    { suffix: " правое", blankSuffix: " правая" },
  ] as const;

  let totalItems = 0;
  let totalBom = 0;
  const productIds: string[] = [];

  // Создаём общие (непарные) компоненты один раз
  const sharedIdMap = new Map<string, string>();
  for (const comp of components) {
    if (comp.isPaired) continue;
    let itemId: string;
    if (comp.existingId) {
      itemId = comp.existingId;
    } else {
      const item = await tx.item.create({
        data: {
          id: crypto.randomUUID(),
          name: comp.name.trim(),
          typeId: comp.type,
          unitId: comp.unit || "pcs",
          description: comp.description || null,
          images: [],
          pricePerUnit: comp.pricePerUnit ?? null,
        },
      });
      itemId = item.id;
      totalItems++;
    }
    sharedIdMap.set(comp.tempId, itemId);
  }

  // Начальные остатки для общих компонентов
  for (const comp of components) {
    if (comp.isPaired) continue;
    if (comp.stockQuantity && comp.stockQuantity > 0) {
      const itemId = sharedIdMap.get(comp.tempId);
      if (itemId) {
        await tx.stockMovement.create({
          data: {
            type: "supplier_income",
            itemId,
            quantity: comp.stockQuantity,
            comment: "Начальный остаток (конструктор)",
          },
        });
      }
    }
  }

  for (const side of sides) {
    const idMap = new Map<string, string>(sharedIdMap);

    // Создать изделие
    const created = await tx.item.create({
      data: {
        id: crypto.randomUUID(),
        name: product.name.trim() + side.suffix,
        typeId: "product",
        unitId: product.unit || "pcs",
        description: product.description || null,
        images: [],
      },
    });
    idMap.set("product", created.id);
    productIds.push(created.id);
    totalItems++;

    // Создать парные компоненты для этой стороны
    for (const comp of components) {
      if (!comp.isPaired) continue;
      let itemId: string;
      if (comp.existingId) {
        itemId = comp.existingId;
      } else {
        const item = await tx.item.create({
          data: {
            id: crypto.randomUUID(),
            name: comp.name.trim() + side.blankSuffix,
            typeId: comp.type,
            unitId: comp.unit || "pcs",
            description: comp.description || null,
            images: [],
            pricePerUnit: comp.pricePerUnit ?? null,
          },
        });
        itemId = item.id;
        totalItems++;
      }
      idMap.set(comp.tempId, itemId);
    }

    // BOM-связи
    for (const comp of components) {
      const childId = idMap.get(comp.tempId);
      const parentId = idMap.get(comp.parentTempId);
      if (!childId || !parentId) continue;

      await tx.bomEntry.upsert({
        where: { parentId_childId: { parentId, childId } },
        update: { quantity: comp.quantity },
        create: { parentId, childId, quantity: comp.quantity },
      });
      totalBom++;
    }

    // Начальные остатки для парных компонентов
    for (const comp of components) {
      if (!comp.isPaired) continue;
      if (comp.stockQuantity && comp.stockQuantity > 0) {
        const itemId = idMap.get(comp.tempId);
        if (itemId) {
          await tx.stockMovement.create({
            data: {
              type: "supplier_income",
              itemId,
              quantity: comp.stockQuantity,
              comment: "Начальный остаток (конструктор)",
            },
          });
        }
      }
    }
  }

  return { productIds, itemCount: totalItems, bomCount: totalBom };
}
