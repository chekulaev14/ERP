import { NextResponse } from "next/server";
import * as stockService from "@/services/stock.service";
import { getAuthContext } from "@/lib/auth-helper";
import { createMovementSchema } from "@/lib/schemas/stock.schema";
import { parseBody } from "@/lib/schemas/helpers";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (itemId) {
    const [balance, movements] = await Promise.all([
      stockService.getBalance(itemId),
      stockService.getMovements(itemId, 50),
    ]);
    return NextResponse.json({ balance, movements });
  }

  const [balances, movements] = await Promise.all([
    stockService.getAllBalances(),
    stockService.getMovements(undefined, 100),
  ]);

  return NextResponse.json({ balances, movements });
}

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request);
    const body = await request.json();
    const parsed = parseBody(createMovementSchema, body);
    if (!parsed.success) return parsed.response;

    const { action, itemId, quantity, comment, operationKey } = parsed.data;

    const item = await stockService.validateItemExists(itemId);
    if (!item) {
      return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
    }

    switch (action) {
      case "SUPPLIER_INCOME": {
        const result = await stockService.createIncomeOperation({
          type: action,
          itemId,
          quantity,
          createdById: auth.actorId,
          comment,
          operationKey,
        });
        return NextResponse.json(result);
      }

      case "SHIPMENT": {
        const result = await stockService.createShipmentOperation({
          itemId,
          quantity,
          createdById: auth.actorId,
          comment,
          operationKey,
        });
        return NextResponse.json(result);
      }
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
