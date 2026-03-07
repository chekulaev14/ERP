import { prisma } from "@/lib/prisma";
import { toNumber } from "./helpers/serialize";

const DEFAULT_LOCATION = "MAIN";

interface Shortage {
  name: string;
  needed: number;
  available: number;
}

interface AssemblyResult {
  movement: { id: string };
  writeOffs: { id: string }[];
  balance: number;
}

export class AssemblyError extends Error {
  constructor(
    message: string,
    public shortages?: Shortage[],
  ) {
    super(message);
    this.name = "AssemblyError";
  }
}

export async function assemble(params: {
  itemId: string;
  quantity: number;
  workerId?: string;
  createdById?: string;
  comment?: string;
  operationKey?: string;
}): Promise<AssemblyResult> {
  const { itemId, quantity, workerId, createdById, comment, operationKey } = params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new AssemblyError("Позиция не найдена");

  const children = await prisma.bomEntry.findMany({
    where: { parentId: itemId },
    include: { child: true },
  });

  if (children.length === 0) {
    throw new AssemblyError("У позиции нет спецификации (BOM)");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Idempotency: если operationKey уже существует — вернуть существующую операцию
    const opKey = operationKey ?? `asm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const existing = await tx.inventoryOperation.findUnique({
      where: { operationKey: opKey },
      include: { movements: { select: { id: true, type: true, itemId: true } } },
    });
    if (existing) {
      const incomeMovement = existing.movements.find((m) => m.type === "ASSEMBLY_INCOME");
      const writeOffs = existing.movements.filter((m) => m.type === "ASSEMBLY_WRITE_OFF");
      const bal = await tx.stockBalance.findUnique({
        where: { itemId_locationId: { itemId, locationId: DEFAULT_LOCATION } },
      });
      return {
        movement: { id: incomeMovement?.id ?? existing.id },
        writeOffs: writeOffs.map((w) => ({ id: w.id })),
        balance: bal ? toNumber(bal.quantity) : 0,
      };
    }

    // Создаём операцию
    const operation = await tx.inventoryOperation.create({
      data: { operationKey: opKey, type: "ASSEMBLY", createdById },
    });

    // Собираем все itemId (компоненты + изделие) для блокировки в порядке ASC
    const allItemIds = [...children.map((c) => c.childId), itemId].sort();
    const uniqueIds = [...new Set(allItemIds)];

    // Ensure StockBalance rows exist для всех, потом FOR UPDATE в порядке PK
    for (const id of uniqueIds) {
      await tx.$queryRaw`
        INSERT INTO stock_balances (item_id, location_id, quantity, updated_at)
        VALUES (${id}, ${DEFAULT_LOCATION}, 0, NOW())
        ON CONFLICT (item_id, location_id) DO NOTHING
      `;
    }
    const lockedRows = await tx.$queryRaw<{ item_id: string; quantity: number }[]>`
      SELECT item_id, quantity FROM stock_balances
      WHERE location_id = ${DEFAULT_LOCATION} AND item_id = ANY(${uniqueIds})
      ORDER BY item_id ASC
      FOR UPDATE
    `;

    const balanceMap: Record<string, number> = {};
    for (const row of lockedRows) {
      balanceMap[row.item_id] = toNumber(row.quantity);
    }

    // Проверяем остатки
    const shortages: Shortage[] = [];
    for (const child of children) {
      const needed = toNumber(child.quantity) * quantity;
      const available = balanceMap[child.childId] ?? 0;
      if (available < needed) {
        shortages.push({
          name: child.child.name,
          needed: Math.round(needed * 1000) / 1000,
          available: Math.round(available * 1000) / 1000,
        });
      }
    }
    if (shortages.length > 0) {
      throw new AssemblyError("Недостаточно компонентов", shortages);
    }

    // Списание компонентов
    const writeOffs = [];
    for (const child of children) {
      const needed = toNumber(child.quantity) * quantity;
      const mov = await tx.stockMovement.create({
        data: {
          type: "ASSEMBLY_WRITE_OFF",
          itemId: child.childId,
          quantity: needed,
          workerId,
          createdById,
          operationId: operation.id,
          fromLocationId: DEFAULT_LOCATION,
          toLocationId: null,
          comment: `Списание на сборку ${item.name} x${quantity}`,
        },
      });
      await tx.$queryRaw`
        UPDATE stock_balances SET quantity = quantity - ${needed}, updated_at = NOW()
        WHERE item_id = ${child.childId} AND location_id = ${DEFAULT_LOCATION}
      `;
      writeOffs.push(mov);
    }

    // Приход изделия
    const movement = await tx.stockMovement.create({
      data: {
        type: "ASSEMBLY_INCOME",
        itemId,
        quantity,
        workerId,
        createdById,
        operationId: operation.id,
        fromLocationId: null,
        toLocationId: DEFAULT_LOCATION,
        comment: comment || `Сборка ${quantity} шт`,
      },
    });
    await tx.$queryRaw`
      UPDATE stock_balances SET quantity = quantity + ${quantity}, updated_at = NOW()
      WHERE item_id = ${itemId} AND location_id = ${DEFAULT_LOCATION}
    `;

    // Читаем итоговый баланс
    const [bal] = await tx.$queryRaw<[{ quantity: number }]>`
      SELECT quantity FROM stock_balances
      WHERE item_id = ${itemId} AND location_id = ${DEFAULT_LOCATION}
    `;

    return {
      movement: { id: movement.id },
      writeOffs: writeOffs.map((w) => ({ id: w.id })),
      balance: toNumber(bal.quantity),
    };
  });

  return result;
}
