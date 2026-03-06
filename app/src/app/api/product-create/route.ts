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
}

interface ProductCreateInput {
  product: {
    name: string;
    unit: string;
    description?: string;
  };
  components: ComponentInput[];
}

export async function POST(request: Request) {
  let body: ProductCreateInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
  }

  const { product, components } = body;

  if (!product.name?.trim()) {
    return NextResponse.json({ error: "Название изделия обязательно" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idMap = new Map<string, string>();

      // 1. Создать изделие
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

      // 2. Создать компоненты (или привязать существующие)
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

      // 3. Создать BOM-связи
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

      return { productId: created.id, itemCount: components.length + 1, bomCount };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("product-create error:", err);
    const message = err instanceof Error ? err.message : "Ошибка при создании";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
