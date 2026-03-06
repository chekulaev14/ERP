import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const itemId = searchParams.get("itemId");
  const search = searchParams.get("search");

  // Получить BOM конкретной позиции
  if (itemId) {
    const [childEntries, parentEntries] = await Promise.all([
      prisma.bomEntry.findMany({
        where: { parentId: itemId, child: { deletedAt: null } },
        include: { child: true },
      }),
      prisma.bomEntry.findMany({
        where: { childId: itemId, parent: { deletedAt: null } },
        include: { parent: true },
      }),
    ]);

    const children = childEntries.map((e) => ({
      item: mapItem(e.child),
      quantity: e.quantity,
    }));

    const parents = parentEntries.map((e) => ({
      item: mapItem(e.parent),
      quantity: e.quantity,
    }));

    return NextResponse.json({ children, parents });
  }

  const deleted = searchParams.get("deleted");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // По умолчанию показываем только активные, deleted=1 — только удалённые
  if (deleted === "1") {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }

  if (type) where.typeId = type;
  if (category) where.categoryId = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { type: true },
      orderBy: [{ type: { order: "asc" } }, { name: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    items: items.map(mapItem),
    categories,
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const created = await prisma.item.create({
    data: {
      id: crypto.randomUUID(),
      name,
      typeId: body.typeId || "material",
      unitId: body.unitId || "pcs",
      categoryId: body.categoryId || null,
      description: body.description || null,
      images: [],
      pricePerUnit: body.pricePerUnit ? Number(body.pricePerUnit) : null,
    },
  });

  return NextResponse.json(mapItem(created), { status: 201 });
}

function mapItem(dbItem: {
  id: string;
  name: string;
  typeId: string;
  unitId: string;
  categoryId: string | null;
  description: string | null;
  images: string[];
  pricePerUnit: number | null;
}) {
  return {
    id: dbItem.id,
    name: dbItem.name,
    type: dbItem.typeId,
    unit: dbItem.unitId,
    category: dbItem.categoryId,
    description: dbItem.description,
    images: dbItem.images,
    pricePerUnit: dbItem.pricePerUnit,
  };
}
