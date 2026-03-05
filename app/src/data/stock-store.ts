// Временное хранилище остатков и движений (в памяти, потом заменим на БД)

import { StockMovement, allItems } from "./nomenclature";

// Остатки: itemId → количество
const stockBalances: Map<string, number> = new Map();

// История движений
const movements: StockMovement[] = [];

let movementCounter = 0;

// Инициализация демо-остатками
function initDemoStock() {
  // Сырьё (в кг)
  stockBalances.set("raw-08ps-2.0", 2500);
  stockBalances.set("raw-08kp-1.5", 1800);
  stockBalances.set("raw-08ps-1.2", 3200);
  stockBalances.set("raw-08kp-1.0", 1400);
  stockBalances.set("raw-09g2s-3.0", 950);
  stockBalances.set("raw-09g2s-4.0", 680);
  stockBalances.set("raw-09g2s-5.0", 420);
  stockBalances.set("raw-65g-0.5", 85);
  stockBalances.set("raw-amg2-0.8", 180);
  stockBalances.set("raw-12x18-2.0", 320);
  stockBalances.set("raw-oцинк-1.0", 560);
  stockBalances.set("raw-rivets-4.8", 15000);
  stockBalances.set("raw-bolts-m8", 8000);
  stockBalances.set("raw-nuts-m8", 8000);
  stockBalances.set("raw-washers-m8", 10000);

  // Заготовки (шт)
  stockBalances.set("blank-450x120-08ps-2", 340);
  stockBalances.set("blank-400x50-08ps-2", 280);
  stockBalances.set("blank-70x50-08ps-2", 1200);
  stockBalances.set("blank-60x40-08ps-2", 600);
  stockBalances.set("blank-d180-09g2s-3", 150);
  stockBalances.set("blank-d160-09g2s-3", 150);
  stockBalances.set("blank-d340-08kp-1", 90);
  stockBalances.set("blank-180x120-09g2s-4", 110);
  stockBalances.set("blank-100x80-09g2s-3", 220);
  stockBalances.set("blank-550x450-08ps-1.2", 45);
  stockBalances.set("blank-400x200-amg2-0.8", 80);

  // Детали (шт) — частично произведены
  stockBalances.set("part-up100-base", 120);
  stockBalances.set("part-up100-rib-long", 95);
  stockBalances.set("part-up100-rib-cross", 480);
  stockBalances.set("part-up100-plate", 250);
  stockBalances.set("part-pp200-beam", 60);
  stockBalances.set("part-pp200-gusset-l", 55);
  stockBalances.set("part-pp200-gusset-r", 55);
  stockBalances.set("part-pp200-support", 130);
  stockBalances.set("part-ak300-panel", 35);
  stockBalances.set("part-ak300-reinf", 40);
  stockBalances.set("part-ak300-joint", 85);
  stockBalances.set("part-cp100-upper", 70);
  stockBalances.set("part-cp100-lower", 65);
  stockBalances.set("part-cp100-ring", 80);
  stockBalances.set("part-cp100-washer", 90);
  stockBalances.set("part-ks200-clamp", 100);
  stockBalances.set("part-ks200-base", 95);
  stockBalances.set("part-ks200-press", 110);
  stockBalances.set("part-ts100-disc", 45);
  stockBalances.set("part-ts100-cover", 50);
  stockBalances.set("part-ts100-bracket", 60);
  stockBalances.set("part-pk200-shim", 300);
  stockBalances.set("part-pk200-clip", 280);
  stockBalances.set("part-pk200-lock", 320);
  stockBalances.set("part-ksu300-body", 25);
  stockBalances.set("part-ksu300-plate", 30);
  stockBalances.set("part-kd100-base", 40);
  stockBalances.set("part-kd100-rib", 85);
  stockBalances.set("part-kd100-cup", 50);
  stockBalances.set("part-kd100-pad", 45);
  stockBalances.set("part-hv200-upper", 180);
  stockBalances.set("part-hv200-lower", 175);
  stockBalances.set("part-hv200-strap", 400);
  stockBalances.set("part-st300-clip", 2000);
  stockBalances.set("part-st300-damper", 2200);
  stockBalances.set("part-kb100-bottom", 20);
  stockBalances.set("part-kb100-side-l", 22);
  stockBalances.set("part-kb100-side-r", 22);
  stockBalances.set("part-kb100-cross", 50);
  stockBalances.set("part-te200-screen", 35);
  stockBalances.set("part-te200-bracket", 120);
  stockBalances.set("part-te200-vibro", 180);
  stockBalances.set("part-kd300-panel", 30);
  stockBalances.set("part-kd300-edge", 65);
  stockBalances.set("part-kd300-tab", 200);
  stockBalances.set("part-op300-plate", 55);
  stockBalances.set("part-op300-washer", 70);
  stockBalances.set("part-op300-mount", 60);

  // Подсборки (шт) — немного в наличии
  stockBalances.set("sub-up100-core", 30);
  stockBalances.set("sub-cp100-pair", 20);
  stockBalances.set("sub-kd100-frame", 15);
  stockBalances.set("sub-kb100-box", 8);

  // Готовые изделия (шт)
  stockBalances.set("prod-up100", 45);
  stockBalances.set("prod-pp200", 30);
  stockBalances.set("prod-ak300", 18);
  stockBalances.set("prod-cp100", 25);
  stockBalances.set("prod-ks200", 60);
  stockBalances.set("prod-op300", 35);
  stockBalances.set("prod-ts100", 20);
  stockBalances.set("prod-pk200", 80);
  stockBalances.set("prod-ksu300", 12);
  stockBalances.set("prod-kd100", 10);
  stockBalances.set("prod-hv200", 150);
  stockBalances.set("prod-st300", 1500);
  stockBalances.set("prod-kb100", 6);
  stockBalances.set("prod-te200", 15);
  stockBalances.set("prod-kd300", 10);
}

initDemoStock();

export function getBalance(itemId: string): number {
  return stockBalances.get(itemId) ?? 0;
}

export function getAllBalances(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of allItems) {
    result[item.id] = stockBalances.get(item.id) ?? 0;
  }
  return result;
}

export function addMovement(
  type: StockMovement["type"],
  itemId: string,
  quantity: number,
  performedBy?: string,
  workerId?: string,
  comment?: string
): StockMovement {
  movementCounter++;
  const movement: StockMovement = {
    id: `mov-${movementCounter}`,
    type,
    itemId,
    quantity,
    date: new Date().toISOString(),
    performedBy,
    workerId,
    comment,
  };
  movements.push(movement);

  const current = stockBalances.get(itemId) ?? 0;
  stockBalances.set(itemId, current + quantity);

  return movement;
}

export function getMovements(limit = 50): StockMovement[] {
  return [...movements].reverse().slice(0, limit);
}

export function getMovementsByItem(itemId: string): StockMovement[] {
  return movements.filter((m) => m.itemId === itemId).reverse();
}
