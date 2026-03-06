import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (itemId) {
    const [balance, movements] = await Promise.all([
      getBalance(itemId),
      prisma.stockMovement.findMany({
        where: { itemId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ balance, movements });
  }

  const [balances, movements] = await Promise.all([
    getAllBalances(),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ balances, movements });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, itemId, quantity, performedBy, workerId, comment } = body;

  if (!action || !itemId || !quantity) {
    return NextResponse.json({ error: "Не указаны обязательные поля" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
  }

  switch (action) {
    case "supplier_income": {
      const mov = await prisma.stockMovement.create({
        data: { type: "supplier_income", itemId, quantity, performedBy, comment },
      });
      return NextResponse.json({ movement: mov, balance: await getBalance(itemId) });
    }

    case "production_income": {
      const mov = await prisma.stockMovement.create({
        data: { type: "production_income", itemId, quantity, performedBy, workerId, comment },
      });
      return NextResponse.json({ movement: mov, balance: await getBalance(itemId) });
    }

    case "assembly": {
      const children = await prisma.bomEntry.findMany({
        where: { parentId: itemId },
        include: { child: true },
      });

      if (children.length === 0) {
        return NextResponse.json({ error: "У позиции нет спецификации (BOM)" }, { status: 400 });
      }

      const shortages: { name: string; needed: number; available: number }[] = [];
      for (const child of children) {
        const needed = child.quantity * quantity;
        const available = await getBalance(child.childId);
        if (available < needed) {
          shortages.push({
            name: child.child.name,
            needed: Math.round(needed * 1000) / 1000,
            available: Math.round(available * 1000) / 1000,
          });
        }
      }

      if (shortages.length > 0) {
        return NextResponse.json({ error: "Недостаточно компонентов", shortages }, { status: 400 });
      }

      // Списать компоненты и начислить изделие в одной транзакции
      const result = await prisma.$transaction(async (tx) => {
        const writeOffs = [];
        for (const child of children) {
          const needed = child.quantity * quantity;
          const mov = await tx.stockMovement.create({
            data: {
              type: "assembly_write_off",
              itemId: child.childId,
              quantity: -needed,
              performedBy,
              comment: `Списание на сборку ${item.name} x${quantity}`,
            },
          });
          writeOffs.push(mov);
        }

        const incomeMov = await tx.stockMovement.create({
          data: {
            type: "assembly_income",
            itemId,
            quantity,
            performedBy,
            comment: comment || `Сборка ${quantity} шт`,
          },
        });

        return { movement: incomeMov, writeOffs };
      });

      return NextResponse.json({
        ...result,
        balance: await getBalance(itemId),
      });
    }

    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}

async function getBalance(itemId: string): Promise<number> {
  const result = await prisma.stockMovement.aggregate({
    where: { itemId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

async function getAllBalances(): Promise<Record<string, number>> {
  const items = await prisma.item.findMany({ select: { id: true } });
  const movements = await prisma.stockMovement.groupBy({
    by: ["itemId"],
    _sum: { quantity: true },
  });

  const balances: Record<string, number> = {};
  for (const item of items) {
    balances[item.id] = 0;
  }
  for (const m of movements) {
    balances[m.itemId] = m._sum.quantity ?? 0;
  }
  return balances;
}
