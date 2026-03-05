import { NextResponse } from "next/server";
import { getAllBalances, getBalance, addMovement, getMovements, getMovementsByItem } from "@/data/stock-store";
import { getChildren, getItem, bom } from "@/data/nomenclature";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (itemId) {
    return NextResponse.json({
      balance: getBalance(itemId),
      movements: getMovementsByItem(itemId),
    });
  }

  return NextResponse.json({
    balances: getAllBalances(),
    movements: getMovements(100),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, itemId, quantity, performedBy, workerId, comment } = body;

  if (!action || !itemId || !quantity) {
    return NextResponse.json({ error: "Не указаны обязательные поля" }, { status: 400 });
  }

  const item = getItem(itemId);
  if (!item) {
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
  }

  switch (action) {
    case "supplier_income": {
      const mov = addMovement("supplier_income", itemId, quantity, performedBy, undefined, comment);
      return NextResponse.json({ movement: mov, balance: getBalance(itemId) });
    }

    case "production_income": {
      const mov = addMovement("production_income", itemId, quantity, performedBy, workerId, comment);
      return NextResponse.json({ movement: mov, balance: getBalance(itemId) });
    }

    case "assembly": {
      // Проверить наличие компонентов
      const children = getChildren(itemId);
      if (children.length === 0) {
        return NextResponse.json({ error: "У позиции нет спецификации (BOM)" }, { status: 400 });
      }

      const shortages: { name: string; needed: number; available: number }[] = [];
      for (const child of children) {
        const needed = child.quantity * quantity;
        const available = getBalance(child.item.id);
        if (available < needed) {
          shortages.push({
            name: child.item.name,
            needed: Math.round(needed * 1000) / 1000,
            available: Math.round(available * 1000) / 1000,
          });
        }
      }

      if (shortages.length > 0) {
        return NextResponse.json({ error: "Недостаточно компонентов", shortages }, { status: 400 });
      }

      // Списать компоненты
      const writeOffs = [];
      for (const child of children) {
        const needed = child.quantity * quantity;
        const mov = addMovement("assembly_write_off", child.item.id, -needed, performedBy, undefined, `Списание на сборку ${item.name} x${quantity}`);
        writeOffs.push(mov);
      }

      // Начислить готовое изделие
      const incomeMov = addMovement("assembly_income", itemId, quantity, performedBy, undefined, comment || `Сборка ${quantity} шт`);

      return NextResponse.json({
        movement: incomeMov,
        writeOffs,
        balance: getBalance(itemId),
      });
    }

    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}
