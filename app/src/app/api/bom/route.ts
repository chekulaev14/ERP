import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Добавить BOM-связь
export async function POST(request: Request) {
  const { parentId, childId, quantity } = await request.json();

  if (!parentId || !childId || !quantity) {
    return NextResponse.json({ error: "parentId, childId и quantity обязательны" }, { status: 400 });
  }

  if (parentId === childId) {
    return NextResponse.json({ error: "Позиция не может быть компонентом самой себя" }, { status: 400 });
  }

  const entry = await prisma.bomEntry.upsert({
    where: { parentId_childId: { parentId, childId } },
    update: { quantity: Number(quantity) },
    create: { parentId, childId, quantity: Number(quantity) },
  });

  return NextResponse.json(entry, { status: 201 });
}

// Изменить количество
export async function PUT(request: Request) {
  const { parentId, childId, quantity } = await request.json();

  if (!parentId || !childId || quantity === undefined) {
    return NextResponse.json({ error: "parentId, childId и quantity обязательны" }, { status: 400 });
  }

  const entry = await prisma.bomEntry.update({
    where: { parentId_childId: { parentId, childId } },
    data: { quantity: Number(quantity) },
  });

  return NextResponse.json(entry);
}

// Удалить BOM-связь
export async function DELETE(request: Request) {
  const { parentId, childId } = await request.json();

  if (!parentId || !childId) {
    return NextResponse.json({ error: "parentId и childId обязательны" }, { status: 400 });
  }

  await prisma.bomEntry.delete({
    where: { parentId_childId: { parentId, childId } },
  });

  return NextResponse.json({ ok: true });
}
