import { prisma } from "@/lib/prisma";
import { toNumber } from "./helpers/serialize";

export class BomVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BomVersionError";
  }
}

// --- Read ---

export async function getBomVersions(itemId: string) {
  const boms = await prisma.bom.findMany({
    where: { itemId },
    include: {
      lines: {
        include: { componentItem: { select: { id: true, name: true, code: true } } },
        orderBy: { lineNo: "asc" },
      },
    },
    orderBy: { version: "desc" },
  });

  return boms.map((b) => ({
    id: b.id,
    itemId: b.itemId,
    version: b.version,
    status: b.status,
    effectiveFrom: b.effectiveFrom.toISOString(),
    effectiveTo: b.effectiveTo?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    lines: b.lines.map((l) => ({
      id: l.id,
      lineNo: l.lineNo,
      componentItemId: l.componentItemId,
      componentName: l.componentItem.name,
      componentCode: l.componentItem.code,
      quantity: toNumber(l.quantity),
      scrapFactor: l.scrapFactor ? toNumber(l.scrapFactor) : null,
      note: l.note,
    })),
  }));
}

export async function getActiveBom(itemId: string) {
  const bom = await prisma.bom.findFirst({
    where: { itemId, status: "ACTIVE" },
    include: {
      lines: {
        include: { componentItem: { select: { id: true, name: true, code: true } } },
        orderBy: { lineNo: "asc" },
      },
    },
  });
  return bom;
}

// --- Write ---

export async function createDraft(params: {
  itemId: string;
  createdById?: string;
  lines: { componentItemId: string; quantity: number; scrapFactor?: number; note?: string }[];
}) {
  const { itemId, createdById, lines } = params;

  // Следующая версия
  const maxVersion = await prisma.bom.aggregate({
    where: { itemId },
    _max: { version: true },
  });
  const nextVersion = (maxVersion._max.version ?? 0) + 1;

  return prisma.bom.create({
    data: {
      itemId,
      version: nextVersion,
      status: "DRAFT",
      effectiveFrom: new Date(),
      createdById,
      lines: {
        create: lines.map((l, i) => ({
          lineNo: i + 1,
          componentItemId: l.componentItemId,
          quantity: l.quantity,
          scrapFactor: l.scrapFactor ?? null,
          note: l.note ?? null,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Активация версии BOM.
 * В одной транзакции:
 * 1. Архивирует текущую ACTIVE версию
 * 2. Ставит новую версию в ACTIVE
 * 3. Синхронизирует BomEntry (runtime) из BomLine
 */
export async function activateVersion(bomId: string) {
  return prisma.$transaction(async (tx) => {
    const bom = await tx.bom.findUnique({
      where: { id: bomId },
      include: { lines: true },
    });
    if (!bom) throw new BomVersionError("Версия BOM не найдена");
    if (bom.status === "ACTIVE") return bom;
    if (bom.status === "ARCHIVED") {
      throw new BomVersionError("Нельзя активировать архивную версию");
    }
    if (bom.lines.length === 0) {
      throw new BomVersionError("Нельзя активировать пустую версию BOM");
    }

    // Архивируем текущую ACTIVE
    await tx.bom.updateMany({
      where: { itemId: bom.itemId, status: "ACTIVE" },
      data: { status: "ARCHIVED", effectiveTo: new Date() },
    });

    // Активируем новую
    await tx.bom.update({
      where: { id: bomId },
      data: { status: "ACTIVE", effectiveFrom: new Date() },
    });

    // Синхронизируем runtime BomEntry
    await tx.bomEntry.deleteMany({ where: { parentId: bom.itemId } });
    for (const line of bom.lines) {
      await tx.bomEntry.create({
        data: {
          parentId: bom.itemId,
          childId: line.componentItemId,
          quantity: line.quantity,
        },
      });
    }

    return tx.bom.findUnique({
      where: { id: bomId },
      include: { lines: true },
    });
  });
}

export async function archiveVersion(bomId: string) {
  const bom = await prisma.bom.findUnique({ where: { id: bomId } });
  if (!bom) throw new BomVersionError("Версия BOM не найдена");
  if (bom.status === "ACTIVE") {
    throw new BomVersionError("Нельзя архивировать активную версию — сначала активируйте другую");
  }
  return prisma.bom.update({
    where: { id: bomId },
    data: { status: "ARCHIVED" },
  });
}
