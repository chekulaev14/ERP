import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.typeId !== undefined) data.typeId = body.typeId;
  if (body.unitId !== undefined) data.unitId = body.unitId;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (body.pricePerUnit !== undefined) data.pricePerUnit = body.pricePerUnit ? Number(body.pricePerUnit) : null;

  const updated = await prisma.item.update({
    where: { id },
    data,
    include: { type: true },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    type: updated.typeId,
    unit: updated.unitId,
    category: updated.categoryId,
    description: updated.description,
    images: updated.images,
    pricePerUnit: updated.pricePerUnit,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Soft delete — ставим deletedAt вместо реального удаления
  await prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// Восстановление из удалённых
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.item.update({
    where: { id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ ok: true });
}
