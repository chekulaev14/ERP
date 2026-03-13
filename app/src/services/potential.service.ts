import { prisma } from "@/lib/prisma";
import { toNumber } from "@/services/helpers/serialize";
import type { PotentialItem, Bottleneck, PotentialBreakdown } from "@/lib/types";

interface ItemInfo {
  id: string;
  name: string;
  typeId: string;
  unitId: string;
}

type InputEntry = { itemId: string; qty: number };
type RecipeMap = Map<string, { inputs: InputEntry[]; outputQty: number }>;
type BalancesMap = Map<string, number>;
type ItemsMap = Map<string, ItemInfo>;

interface ComputeResult {
  available: number;
  canProduce: number;
  bottleneck: Bottleneck | null;
  chain: PotentialBreakdown[];
}

/**
 * Строит карту рецептов из активных маршрутов.
 * Ключ — outputItemId шага, значение — входы + выход шага.
 * Для каждого outputItem берётся producing step (последний шаг маршрута определяет конечное изделие,
 * но промежуточные шаги тоже имеют свои рецепты).
 */
function buildRecipeMap(
  steps: { outputItemId: string; outputQty: unknown; inputs: { itemId: string; qty: unknown }[] }[],
): RecipeMap {
  const map: RecipeMap = new Map();

  for (const step of steps) {
    const outputQty = toNumber(step.outputQty as number) ?? 1;
    const inputs: InputEntry[] = step.inputs
      .map((inp) => ({ itemId: inp.itemId, qty: toNumber(inp.qty as number) ?? 0 }))
      .filter((inp) => inp.qty > 0);

    if (inputs.length > 0) {
      map.set(step.outputItemId, { inputs, outputQty });
    }
  }

  return map;
}

/**
 * Рекурсивно считает доступное количество позиции:
 * available = balance + canProduce (из компонентов по маршруту)
 */
function computeAvailable(
  itemId: string,
  recipeMap: RecipeMap,
  balances: BalancesMap,
  itemsMap: ItemsMap,
  visited: Set<string>,
): ComputeResult {
  if (visited.has(itemId)) {
    return { available: 0, canProduce: 0, bottleneck: null, chain: [] };
  }
  visited.add(itemId);

  const balance = balances.get(itemId) ?? 0;
  const recipe = recipeMap.get(itemId);

  if (!recipe) {
    return { available: balance, canProduce: 0, bottleneck: null, chain: [] };
  }

  let minCanProduce = Infinity;
  let bottleneck: Bottleneck | null = null;
  const chain: PotentialBreakdown[] = [];

  for (const input of recipe.inputs) {
    const childResult = computeAvailable(input.itemId, recipeMap, balances, itemsMap, new Set(visited));
    // Сколько выходных единиц можно сделать из доступного количества этого входа
    const neededPerUnit = input.qty / recipe.outputQty;
    const canProduceFromChild = neededPerUnit > 0 ? Math.floor(childResult.available / neededPerUnit) : 0;
    const childInfo = itemsMap.get(input.itemId);

    chain.push({
      itemId: input.itemId,
      name: childInfo?.name ?? "",
      quantity: canProduceFromChild,
      balance: balances.get(input.itemId) ?? 0,
      neededPerUnit,
    });

    if (canProduceFromChild < minCanProduce) {
      minCanProduce = canProduceFromChild;
      bottleneck = {
        itemId: input.itemId,
        name: childInfo?.name ?? "",
        balance: childResult.available,
        neededPerUnit,
      };
    }
  }

  const canProduce = minCanProduce === Infinity ? 0 : minCanProduce;

  return {
    available: balance + canProduce,
    canProduce,
    bottleneck,
    chain,
  };
}

export async function calculateAllPotentials(filterItemId?: string): Promise<PotentialItem[]> {
  const [routingSteps, stockBalances, items] = await Promise.all([
    // Берём все шаги из ACTIVE маршрутов с их входами
    prisma.routingStep.findMany({
      where: { routing: { status: "ACTIVE" } },
      select: {
        outputItemId: true,
        outputQty: true,
        inputs: {
          select: { itemId: true, qty: true },
        },
      },
    }),
    prisma.stockBalance.findMany({
      where: { locationId: "MAIN" },
      select: { itemId: true, quantity: true },
    }),
    prisma.item.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, typeId: true, unitId: true },
    }),
  ]);

  const recipeMap = buildRecipeMap(routingSteps);

  const balances: BalancesMap = new Map();
  for (const sb of stockBalances) {
    balances.set(sb.itemId, toNumber(sb.quantity) ?? 0);
  }

  const itemsMap: ItemsMap = new Map();
  for (const item of items) {
    itemsMap.set(item.id, {
      id: item.id,
      name: item.name,
      typeId: item.typeId,
      unitId: item.unitId,
    });
  }

  const nonMaterialItems = items.filter((i) => i.typeId !== "material");

  const targetItems = filterItemId
    ? items.filter((i) => i.id === filterItemId)
    : nonMaterialItems;

  const results: PotentialItem[] = [];

  for (const item of targetItems) {
    const balance = balances.get(item.id) ?? 0;
    const result = computeAvailable(item.id, recipeMap, balances, itemsMap, new Set());

    results.push({
      itemId: item.id,
      name: item.name,
      type: item.typeId as PotentialItem["type"],
      unit: item.unitId as PotentialItem["unit"],
      balance,
      potential: balance + result.canProduce,
      canProduce: result.canProduce,
      bottleneck: result.bottleneck,
      breakdown: filterItemId ? result.chain : undefined,
    });
  }

  return results;
}
