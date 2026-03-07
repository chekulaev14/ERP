import { prisma } from "@/lib/prisma";
import type { MovementType } from "@/lib/types";
import { toNumber } from "./helpers/serialize";

const DEFAULT_LOCATION = "MAIN";

const INCOME_TYPES: MovementType[] = [
  "SUPPLIER_INCOME",
  "PRODUCTION_INCOME",
  "ASSEMBLY_INCOME",
  "ADJUSTMENT_INCOME",
];

/** Инварианты from/to location по типу движения */
function getLocationsByType(
  type: MovementType,
  locationId: string,
): { fromLocationId: string | null; toLocationId: string | null } {
  if (INCOME_TYPES.includes(type)) {
    return { fromLocationId: null, toLocationId: locationId };
  }
  return { fromLocationId: locationId, toLocationId: null };
}

/** Баланс-дельта: +1 для прихода, -1 для списания */
function balanceDelta(type: MovementType): number {
  return INCOME_TYPES.includes(type) ? 1 : -1;
}

// --- Read ---

export async function getBalance(itemId: string): Promise<number> {
  const row = await prisma.stockBalance.findUnique({
    where: { itemId_locationId: { itemId, locationId: DEFAULT_LOCATION } },
  });
  return row ? toNumber(row.quantity) : 0;
}

export async function getBulkBalances(itemIds: string[]): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};
  const rows = await prisma.stockBalance.findMany({
    where: { itemId: { in: itemIds }, locationId: DEFAULT_LOCATION },
  });
  const balances: Record<string, number> = {};
  for (const id of itemIds) balances[id] = 0;
  for (const row of rows) balances[row.itemId] = toNumber(row.quantity);
  return balances;
}

export async function getAllBalances(): Promise<Record<string, number>> {
  const [rows, items] = await Promise.all([
    prisma.stockBalance.findMany({ where: { locationId: DEFAULT_LOCATION } }),
    prisma.item.findMany({ select: { id: true } }),
  ]);
  const balances: Record<string, number> = {};
  for (const item of items) balances[item.id] = 0;
  for (const row of rows) balances[row.itemId] = toNumber(row.quantity);
  return balances;
}

// --- Write ---

export async function getMovements(itemId?: string, limit = 100) {
  const movements = await prisma.stockMovement.findMany({
    where: itemId ? { itemId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return movements.map((m) => ({ ...m, quantity: toNumber(m.quantity) }));
}

export async function createMovement(data: {
  type: MovementType;
  itemId: string;
  quantity: number;
  workerId?: string;
  comment?: string;
  createdById?: string;
  locationId?: string;
  operationId?: string;
}) {
  const locationId = data.locationId ?? DEFAULT_LOCATION;
  const { fromLocationId, toLocationId } = getLocationsByType(data.type, locationId);
  const delta = balanceDelta(data.type);

  return prisma.$transaction(async (tx) => {
    // Блокируем строку StockBalance (или создаём)
    await tx.$queryRaw`
      INSERT INTO stock_balances (item_id, location_id, quantity, updated_at)
      VALUES (${data.itemId}, ${locationId}, 0, NOW())
      ON CONFLICT (item_id, location_id) DO NOTHING
    `;
    await tx.$queryRaw`
      SELECT * FROM stock_balances
      WHERE item_id = ${data.itemId} AND location_id = ${locationId}
      FOR UPDATE
    `;

    // При списании — проверяем остаток
    if (delta < 0) {
      const [row] = await tx.$queryRaw<[{ quantity: number }]>`
        SELECT quantity FROM stock_balances
        WHERE item_id = ${data.itemId} AND location_id = ${locationId}
      `;
      if (toNumber(row.quantity) < data.quantity) {
        throw new Error(`Недостаточно остатка: ${toNumber(row.quantity)} < ${data.quantity}`);
      }
    }

    const movement = await tx.stockMovement.create({
      data: {
        type: data.type,
        itemId: data.itemId,
        quantity: data.quantity,
        workerId: data.workerId,
        comment: data.comment,
        createdById: data.createdById,
        operationId: data.operationId,
        fromLocationId,
        toLocationId,
      },
    });

    await tx.$queryRaw`
      UPDATE stock_balances
      SET quantity = quantity + ${delta * data.quantity}, updated_at = NOW()
      WHERE item_id = ${data.itemId} AND location_id = ${locationId}
    `;

    return movement;
  });
}

export async function validateItemExists(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return null;
  return item;
}
