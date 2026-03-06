import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  allItems,
  bom,
  categories,
  itemTypeLabels,
  unitLabels,
} from "../src/data/nomenclature.js";

const connectionString = process.env["GORCHEV_DATABASE_URL"] || process.env["DATABASE_URL"] || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const typeColors: Record<string, string> = {
  material: "amber",
  blank: "orange",
  product: "emerald",
};

const typeOrder: Record<string, number> = {
  material: 1,
  blank: 2,
  product: 3,
};

async function main() {
  console.log("Очистка таблиц...");
  await prisma.productionLog.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.bomEntry.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.itemType.deleteMany();

  console.log("Создание типов...");
  for (const [id, name] of Object.entries(itemTypeLabels)) {
    await prisma.itemType.create({
      data: { id, name: name as string, order: typeOrder[id] || 0, color: typeColors[id] || "gray" },
    });
  }

  console.log("Создание единиц измерения...");
  for (const [id, name] of Object.entries(unitLabels)) {
    await prisma.unit.create({ data: { id, name: name as string } });
  }

  console.log("Создание категорий...");
  for (const cat of categories) {
    await prisma.category.create({
      data: { id: cat.id, name: cat.name },
    });
  }

  console.log(`Создание ${allItems.length} позиций...`);
  for (const item of allItems) {
    await prisma.item.create({
      data: {
        id: item.id,
        name: item.name,
        typeId: item.type,
        unitId: item.unit,
        categoryId: item.category || null,
        description: item.description || null,
        images: item.images || [],
        pricePerUnit: item.pricePerUnit || null,
      },
    });
  }

  console.log(`Создание ${bom.length} связей BOM...`);
  const itemIds = new Set(allItems.map((i: { id: string }) => i.id));
  let bomCreated = 0;
  let bomSkipped = 0;
  for (const entry of bom) {
    if (!itemIds.has(entry.parentId) || !itemIds.has(entry.childId)) {
      console.warn(`  Пропуск: ${entry.parentId} -> ${entry.childId} (отсутствует в номенклатуре)`);
      bomSkipped++;
      continue;
    }
    await prisma.bomEntry.create({
      data: {
        parentId: entry.parentId,
        childId: entry.childId,
        quantity: entry.quantity,
      },
    });
    bomCreated++;
  }
  if (bomSkipped > 0) console.log(`  Пропущено ${bomSkipped} невалидных связей`);

  // Демо-остатки (начальные движения)
  console.log("Создание начальных остатков...");
  const demoStock: Record<string, number> = {
    "raw-08ps-2.0": 2500, "raw-08kp-1.5": 1800, "raw-08ps-1.2": 3200,
    "raw-08kp-1.0": 1400, "raw-09g2s-3.0": 950, "raw-09g2s-4.0": 680,
    "raw-09g2s-5.0": 420, "raw-65g-0.5": 85, "raw-amg2-0.8": 180,
    "raw-12x18-2.0": 320, "raw-oцинк-1.0": 560, "raw-rivets-4.8": 15000,
    "raw-bolts-m8": 8000, "raw-nuts-m8": 8000, "raw-washers-m8": 10000,
    "blank-450x120-08ps-2": 340, "blank-400x50-08ps-2": 280,
    "blank-70x50-08ps-2": 1200, "blank-60x40-08ps-2": 600,
    "blank-d180-09g2s-3": 150, "blank-d160-09g2s-3": 150,
    "blank-d340-08kp-1": 90, "blank-180x120-09g2s-4": 110,
    "blank-100x80-09g2s-3": 220, "blank-550x450-08ps-1.2": 45,
    "blank-400x200-amg2-0.8": 80,
    "prod-up100": 45, "prod-pp200": 30, "prod-ak300": 18,
    "prod-cp100": 25, "prod-ks200": 60, "prod-op300": 35,
    "prod-ts100": 20, "prod-pk200": 80, "prod-ksu300": 12,
    "prod-kd100": 10, "prod-hv200": 150, "prod-st300": 1500,
    "prod-kb100": 6, "prod-te200": 15, "prod-kd300": 10,
  };

  let stockCreated = 0;
  for (const [id, qty] of Object.entries(demoStock)) {
    if (!itemIds.has(id)) continue;
    await prisma.stockMovement.create({
      data: {
        type: "adjustment",
        itemId: id,
        quantity: qty,
        performedBy: "Система",
        comment: "Начальные остатки",
      },
    });
    stockCreated++;
  }
  console.log(`  Создано ${stockCreated} начальных движений`);

  // Рабочие
  console.log("Создание рабочих...");
  const workers = [
    { name: "Горчев В.А.", pin: "0000", role: "director" },
    { name: "Смирнова Н.П.", pin: "1111", role: "warehouse" },
    { name: "Иванов А.С.", pin: "1234", role: "worker" },
    { name: "Петров В.И.", pin: "5678", role: "worker" },
    { name: "Сидоров К.М.", pin: "9012", role: "worker" },
    { name: "Козлов Д.А.", pin: "3456", role: "worker" },
    { name: "Морозов Е.В.", pin: "7890", role: "worker" },
  ];
  for (const w of workers) {
    await prisma.worker.create({ data: w });
  }
  console.log(`  Создано ${workers.length} рабочих`);

  console.log("Готово!");
  const counts = {
    types: await prisma.itemType.count(),
    units: await prisma.unit.count(),
    categories: await prisma.category.count(),
    items: await prisma.item.count(),
    bom: await prisma.bomEntry.count(),
    stock: await prisma.stockMovement.count(),
    workers: await prisma.worker.count(),
  };
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
