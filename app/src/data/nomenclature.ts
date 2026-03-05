// Типы номенклатуры

export type ItemType = "material" | "blank" | "part" | "subassembly" | "product";

export const itemTypeLabels: Record<ItemType, string> = {
  material: "Сырьё",
  blank: "Заготовка",
  part: "Деталь",
  subassembly: "Подсборка",
  product: "Изделие",
};

export type Unit = "kg" | "pcs" | "m";

export const unitLabels: Record<Unit, string> = {
  kg: "кг",
  pcs: "шт",
  m: "м",
};

export interface NomenclatureItem {
  id: string;
  name: string;
  type: ItemType;
  unit: Unit;
  category?: string;
  description?: string;
  images?: string[];
  pricePerUnit?: number; // сдельная расценка (для деталей)
}

export interface BomEntry {
  parentId: string;
  childId: string;
  quantity: number; // сколько единиц child нужно на 1 единицу parent
}

export interface StockMovement {
  id: string;
  type: "supplier_income" | "production_income" | "assembly_write_off" | "assembly_income" | "adjustment";
  itemId: string;
  quantity: number;
  date: string;
  performedBy?: string;
  workerId?: string;
  comment?: string;
}

// Категории для группировки
export const categories = [
  { id: "body", name: "Кузовные элементы" },
  { id: "suspension", name: "Элементы подвески" },
  { id: "brakes", name: "Тормозная система" },
  { id: "brackets", name: "Кронштейны и крепёж" },
  { id: "shields", name: "Защитные кожухи" },
];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const img = (name: string) => `${basePath}/images/catalog/${name}`;

// ============================================================
// СЫРЬЁ
// ============================================================
const materials: NomenclatureItem[] = [
  {
    id: "raw-08ps-2.0",
    name: "Рулон 08пс 2.0мм, ш.1250мм",
    type: "material",
    unit: "kg",
    description: "Сталь холоднокатаная 08пс, толщина 2.0мм, ширина рулона 1250мм. ГОСТ 16523-97. Для штамповки кузовных деталей с высокими требованиями к прочности.",
  },
  {
    id: "raw-08kp-1.5",
    name: "Рулон 08кп 1.5мм, ш.1000мм",
    type: "material",
    unit: "kg",
    description: "Сталь холоднокатаная 08кп, толщина 1.5мм, ширина рулона 1000мм. ГОСТ 16523-97. Для штамповки поперечин, балок, швеллерных профилей.",
  },
  {
    id: "raw-08ps-1.2",
    name: "Рулон 08пс 1.2мм, ш.1000мм",
    type: "material",
    unit: "kg",
    description: "Сталь холоднокатаная 08пс, толщина 1.2мм, ширина рулона 1000мм. ГОСТ 16523-97. Для штамповки панелей, арок, кожухов.",
  },
  {
    id: "raw-08kp-1.0",
    name: "Рулон 08кп 1.0мм, ш.1250мм",
    type: "material",
    unit: "kg",
    description: "Сталь холоднокатаная 08кп, толщина 1.0мм, ширина рулона 1250мм. ГОСТ 16523-97. Для тонколистовой штамповки: щиты, кожухи, экраны.",
  },
  {
    id: "raw-09g2s-3.0",
    name: "Лист 09Г2С 3.0мм, 1500x6000мм",
    type: "material",
    unit: "kg",
    description: "Сталь конструкционная низколегированная 09Г2С, толщина 3.0мм. ГОСТ 19281-2014. Повышенная прочность, для кронштейнов и опорных деталей.",
  },
  {
    id: "raw-09g2s-4.0",
    name: "Лист 09Г2С 4.0мм, 1500x6000мм",
    type: "material",
    unit: "kg",
    description: "Сталь конструкционная низколегированная 09Г2С, толщина 4.0мм. ГОСТ 19281-2014. Для силовых кронштейнов, опор двигателя.",
  },
  {
    id: "raw-09g2s-5.0",
    name: "Лист 09Г2С 5.0мм, 1500x6000мм",
    type: "material",
    unit: "kg",
    description: "Сталь конструкционная низколегированная 09Г2С, толщина 5.0мм. ГОСТ 19281-2014. Для тяжелонагруженных кронштейнов суппорта.",
  },
  {
    id: "raw-65g-0.5",
    name: "Лента 65Г 0.5мм, ш.200мм",
    type: "material",
    unit: "kg",
    description: "Сталь пружинная 65Г, толщина 0.5мм, ширина 200мм. ГОСТ 2283-79. Для противоскрипных пластин, фиксаторов, пружинных скоб.",
  },
  {
    id: "raw-amg2-0.8",
    name: "Лист АМг2 0.8мм, 1200x3000мм",
    type: "material",
    unit: "kg",
    description: "Алюминий АМг2, толщина 0.8мм. ГОСТ 21631-76. Для теплозащитных экранов с перфорацией.",
  },
  {
    id: "raw-12x18-2.0",
    name: "Рулон 12Х18Н10Т 2.0мм, ш.1000мм",
    type: "material",
    unit: "kg",
    description: "Нержавеющая сталь 12Х18Н10Т, толщина 2.0мм. ГОСТ 5582-75. Для хомутов и деталей выхлопной системы, стойких к коррозии и нагреву.",
  },
  {
    id: "raw-oцинк-1.0",
    name: "Рулон оцинкованный 1.0мм, ш.1200мм",
    type: "material",
    unit: "kg",
    description: "Сталь тонколистовая оцинкованная, толщина 1.0мм. ГОСТ 14918-80. Для мелких скоб, лепестков, прокладок.",
  },
  {
    id: "raw-rivets-4.8",
    name: "Заклёпки вытяжные 4.8x12мм",
    type: "material",
    unit: "pcs",
    description: "Заклёпки вытяжные алюминий/сталь, D4.8мм, L12мм. DIN 7337. Для соединения тонколистовых деталей.",
  },
  {
    id: "raw-bolts-m8",
    name: "Болты М8x20 оцинк.",
    type: "material",
    unit: "pcs",
    description: "Болт с шестигранной головкой М8x20, оцинковка. ГОСТ 7798-70. Для крепления кронштейнов, кожухов.",
  },
  {
    id: "raw-nuts-m8",
    name: "Гайки М8 оцинк.",
    type: "material",
    unit: "pcs",
    description: "Гайка шестигранная М8, оцинковка. ГОСТ 5915-70.",
  },
  {
    id: "raw-washers-m8",
    name: "Шайбы плоские М8 оцинк.",
    type: "material",
    unit: "pcs",
    description: "Шайба плоская М8, оцинковка. ГОСТ 11371-78.",
  },
];

// ============================================================
// ЗАГОТОВКИ (вырубленные/отрезанные из листа)
// ============================================================
const blanks: NomenclatureItem[] = [
  // Кузовные
  {
    id: "blank-450x120-08ps-2",
    name: "Заготовка 450x120мм, 08пс 2.0мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 450x120мм, вырубка из рулона 08пс 2.0мм. Для основания усилителя порога.",
  },
  {
    id: "blank-400x50-08ps-2",
    name: "Заготовка 400x50мм, 08пс 2.0мм",
    type: "blank",
    unit: "pcs",
    description: "Полоса 400x50мм, вырубка из рулона 08пс 2.0мм. Для продольного ребра жёсткости.",
  },
  {
    id: "blank-70x50-08ps-2",
    name: "Заготовка 70x50мм, 08пс 2.0мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 70x50мм, вырубка из рулона 08пс 2.0мм. Для поперечных рёбер жёсткости.",
  },
  {
    id: "blank-60x40-08ps-2",
    name: "Заготовка 60x40мм, 08пс 2.0мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 60x40мм, вырубка из рулона 08пс 2.0мм. Для монтажных пластин.",
  },
  // Подвеска
  {
    id: "blank-d180-09g2s-3",
    name: "Заготовка D180мм, 09Г2С 3.0мм",
    type: "blank",
    unit: "pcs",
    description: "Круглая заготовка D180мм, вырубка из листа 09Г2С 3.0мм. Для вытяжки чашки пружины.",
  },
  {
    id: "blank-d160-10-3",
    name: "Заготовка D160мм, 09Г2С 3.0мм",
    type: "blank",
    unit: "pcs",
    description: "Круглая заготовка D160мм. Для нижней чашки пружины с дренажным отверстием.",
  },
  // Тормоза
  {
    id: "blank-d340-08kp-1",
    name: "Заготовка D340мм, 08кп 1.0мм",
    type: "blank",
    unit: "pcs",
    description: "Круглая заготовка D340мм, вырубка из рулона 08кп 1.0мм. Для тормозного щита.",
  },
  // Кронштейны
  {
    id: "blank-180x120-09g2s-4",
    name: "Заготовка 180x120мм, 09Г2С 4.0мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 180x120мм, вырубка из листа 09Г2С 4.0мм. Для основания кронштейна двигателя.",
  },
  {
    id: "blank-100x80-09g2s-3",
    name: "Заготовка 100x80мм, 09Г2С 3.0мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 100x80мм. Для ребра жёсткости кронштейна.",
  },
  // Защитные кожухи
  {
    id: "blank-550x450-08ps-1.2",
    name: "Заготовка 550x450мм, 08пс 1.2мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка 550x450мм, вырубка из рулона 08пс 1.2мм. Для нижней панели кожуха бака.",
  },
  {
    id: "blank-400x200-amg2-0.8",
    name: "Заготовка 400x200мм, АМг2 0.8мм",
    type: "blank",
    unit: "pcs",
    description: "Карточка из алюминия 400x200мм. Для теплозащитного экрана.",
  },
];

// ============================================================
// ДЕТАЛИ (штампованные из заготовок)
// ============================================================
const parts: NomenclatureItem[] = [
  // --- Усилитель порога УП-100 ---
  {
    id: "part-up100-base",
    name: "Основание усилителя порога",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Штампованная пластина 450x80x2мм с рёбрами жёсткости. Операции: вырубка → вытяжка → пробивка отверстий → отбортовка кромок.",
    images: [img("part-flat-bracket.jpg"), img("part-mounting-plate.jpg")],
    pricePerUnit: 65,
  },
  {
    id: "part-up100-rib-long",
    name: "Ребро жёсткости продольное",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Продольное ребро 400x30x2мм, П-образный профиль. Операции: вырубка → гибка → калибровка.",
    images: [img("part-rib.jpg")],
    pricePerUnit: 35,
  },
  {
    id: "part-up100-rib-cross",
    name: "Ребро жёсткости поперечное",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Поперечное ребро 70x30x2мм. Операции: вырубка → гибка. 4 шт на одно изделие.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 12,
  },
  {
    id: "part-up100-plate",
    name: "Монтажная пластина крепления",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Пластина крепления 60x40x2мм с 4 отверстиями. Операции: вырубка → пробивка. 2 шт на изделие.",
    images: [img("part-mounting-plate.jpg")],
    pricePerUnit: 18,
  },

  // --- Поперечина пола ПП-200 ---
  {
    id: "part-pp200-beam",
    name: "Балка поперечины",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Штампованная балка 800x60x40мм, швеллерный профиль. Операции: вырубка → вытяжка → обрезка фланцев.",
    images: [img("body-crossmember.jpg"), img("part-cross.jpg")],
    pricePerUnit: 95,
  },
  {
    id: "part-pp200-gusset-l",
    name: "Косынка левая",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Угловая косынка 80x80x1.5мм с отверстиями крепления.",
    images: [img("part-gusset.jpg")],
    pricePerUnit: 22,
  },
  {
    id: "part-pp200-gusset-r",
    name: "Косынка правая",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Угловая косынка 80x80x1.5мм, зеркальная.",
    images: [img("part-gusset.jpg")],
    pricePerUnit: 22,
  },
  {
    id: "part-pp200-support",
    name: "Опорная пластина поперечины",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Пластина 100x60x2мм для крепления к лонжерону. 2 шт на изделие.",
    images: [img("part-mounting-plate.jpg")],
    pricePerUnit: 28,
  },

  // --- Арка колеса задняя АК-300 ---
  {
    id: "part-ak300-panel",
    name: "Наружная панель арки",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Штампованная панель сложной формы 600x400x1.2мм. Операции: вытяжка → обрезка → отбортовка → пробивка.",
    images: [img("body-wheel-arch.jpg"), img("part-side-panel.jpg")],
    pricePerUnit: 120,
  },
  {
    id: "part-ak300-reinf",
    name: "Внутренний усилитель арки",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Усилитель арки 500x80x1.5мм с рёбрами.",
    images: [img("part-rib.jpg")],
    pricePerUnit: 55,
  },
  {
    id: "part-ak300-joint",
    name: "Соединительная пластина арки",
    type: "part",
    unit: "pcs",
    category: "body",
    description: "Пластина стыка 120x60x1.2мм.",
    images: [img("part-flat-bracket.jpg")],
    pricePerUnit: 15,
  },

  // --- Чашка пружины передняя ЧП-100 ---
  {
    id: "part-cp100-upper",
    name: "Чашка верхняя",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Штампованная чашка D140xH25x3мм. Операции: вырубка круга → глубокая вытяжка → обрезка → калибровка.",
    images: [img("part-cup.jpg")],
    pricePerUnit: 75,
  },
  {
    id: "part-cp100-lower",
    name: "Чашка нижняя",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Штампованная чашка D150xH20x3мм с дренажным отверстием. Операции: вырубка → вытяжка → пробивка дренажа.",
    images: [img("part-cup.jpg"), img("suspension-cat.jpg")],
    pricePerUnit: 80,
  },
  {
    id: "part-cp100-ring",
    name: "Опорное кольцо пружины",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Штампованное кольцо D140xD100x2мм. Операции: вырубка → пробивка центрального отверстия.",
    images: [img("part-ring.jpg")],
    pricePerUnit: 30,
  },
  {
    id: "part-cp100-washer",
    name: "Усилительная шайба опоры",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Шайба D60x4мм с центровочным выступом.",
    images: [img("part-washer.jpg")],
    pricePerUnit: 15,
  },

  // --- Кронштейн стабилизатора КС-200 ---
  {
    id: "part-ks200-clamp",
    name: "Скоба стабилизатора",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "U-образная скоба 60x45x3мм под D22 стабилизатор. Операции: вырубка → гибка U-профиля.",
    images: [img("part-clamp.jpg")],
    pricePerUnit: 40,
  },
  {
    id: "part-ks200-base",
    name: "Основание кронштейна стабилизатора",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Пластина 80x60x3мм с двумя крепёжными отверстиями.",
    images: [img("suspension-plate.jpg")],
    pricePerUnit: 35,
  },
  {
    id: "part-ks200-press",
    name: "Прижимная пластина стабилизатора",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Пластина 60x40x2мм, ответная часть скобы.",
    images: [img("part-flat-bracket.jpg")],
    pricePerUnit: 20,
  },

  // --- Тормозной щит передний ТЩ-100 ---
  {
    id: "part-ts100-disc",
    name: "Щит тормозной основной",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Штампованный диск D300x1мм с вырезами под суппорт. Операции: вырубка круга → формовка → пробивка вырезов.",
    images: [img("brake-cat.jpg"), img("part-dust-cover.jpg")],
    pricePerUnit: 85,
  },
  {
    id: "part-ts100-cover",
    name: "Кожух пылезащитный тормоза",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Полукольцо D280x50x0.8мм, защита от грязи и пыли.",
    images: [img("part-cover.jpg")],
    pricePerUnit: 45,
  },
  {
    id: "part-ts100-bracket",
    name: "Кронштейн тормозного шланга",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Кронштейн крепления тормозного шланга 40x20x1.5мм.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 10,
  },

  // --- Пластина колодочная ПК-200 ---
  {
    id: "part-pk200-shim",
    name: "Пластина направляющая колодки",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Штампованная противоскрипная пластина 80x50x0.5мм, пружинная сталь 65Г.",
    images: [img("brake-shim.jpg")],
    pricePerUnit: 18,
  },
  {
    id: "part-pk200-clip",
    name: "Пружинная скоба колодки",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Скоба фиксации 40x15x0.8мм, пружинная сталь.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 12,
  },
  {
    id: "part-pk200-lock",
    name: "Фиксатор колодки",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Штампованный фиксатор 20x10x0.5мм.",
    images: [img("brake-backing.jpg")],
    pricePerUnit: 8,
  },

  // --- Кронштейн суппорта КСУ-300 ---
  {
    id: "part-ksu300-body",
    name: "Корпус кронштейна суппорта",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Штампованный кронштейн 120x80x5мм с направляющими пазами. Операции: вырубка → вытяжка → фрезеровка пазов.",
    images: [img("brackets-cat.jpg"), img("part-flat-bracket.jpg")],
    pricePerUnit: 95,
  },
  {
    id: "part-ksu300-plate",
    name: "Упорная пластина суппорта",
    type: "part",
    unit: "pcs",
    category: "brakes",
    description: "Пластина 60x40x3мм.",
    images: [img("part-mounting-plate.jpg")],
    pricePerUnit: 25,
  },

  // --- Кронштейн двигателя КД-100 ---
  {
    id: "part-kd100-base",
    name: "Основание кронштейна двигателя",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованная пластина 150x100x4мм с рельефом жёсткости. Операции: вырубка → вытяжка рельефа → пробивка отверстий.",
    images: [img("part-flat-bracket.jpg")],
    pricePerUnit: 75,
  },
  {
    id: "part-kd100-rib",
    name: "Ребро жёсткости кронштейна",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Треугольное ребро 80x60x3мм. Операции: вырубка → гибка.",
    images: [img("part-gusset.jpg")],
    pricePerUnit: 30,
  },
  {
    id: "part-kd100-cup",
    name: "Чашка опоры двигателя",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованная чашка D60xH15x3мм под резиновый демпфер. Операции: вырубка круга → вытяжка.",
    images: [img("part-cup.jpg")],
    pricePerUnit: 35,
  },
  {
    id: "part-kd100-pad",
    name: "Монтажная площадка кронштейна",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Пластина 80x60x4мм с 4 отверстиями M10.",
    images: [img("part-mounting-plate.jpg")],
    pricePerUnit: 28,
  },

  // --- Хомут выхлопной ХВ-200 ---
  {
    id: "part-hv200-upper",
    name: "Полухомут верхний",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованный полухомут D55x2мм, нержавейка. Операции: вырубка → гибка → пробивка ушек.",
    images: [img("part-clamp.jpg")],
    pricePerUnit: 30,
  },
  {
    id: "part-hv200-lower",
    name: "Полухомут нижний с опорой",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованный полухомут D55x2мм с опорной лапой, нержавейка.",
    images: [img("part-clamp.jpg"), img("brackets-exhaust.jpg")],
    pricePerUnit: 35,
  },
  {
    id: "part-hv200-strap",
    name: "Стяжная пластина хомута",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Пластина 40x20x2мм с прорезью, нержавейка.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 10,
  },

  // --- Скоба топливопровода СТ-300 ---
  {
    id: "part-st300-clip",
    name: "Скоба топливопровода",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованная скоба 30x15x1мм под трубку D8, оцинковка.",
    images: [img("brackets-fuelclip.jpg")],
    pricePerUnit: 8,
  },
  {
    id: "part-st300-damper",
    name: "Демпферная прокладка топливопровода",
    type: "part",
    unit: "pcs",
    category: "brackets",
    description: "Штампованная прокладка 25x12x0.5мм, оцинковка.",
    images: [img("part-damper.jpg")],
    pricePerUnit: 5,
  },

  // --- Кожух бака КБ-100 ---
  {
    id: "part-kb100-bottom",
    name: "Панель нижняя кожуха бака",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованная панель 500x400x1.2мм с рельефом жёсткости. Операции: вырубка → вытяжка рельефа → обрезка → отбортовка.",
    images: [img("shields-underbody.jpg")],
    pricePerUnit: 110,
  },
  {
    id: "part-kb100-side-l",
    name: "Панель боковая левая кожуха",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Боковая панель 400x100x1.2мм с отбортовкой.",
    images: [img("part-side-panel.jpg")],
    pricePerUnit: 55,
  },
  {
    id: "part-kb100-side-r",
    name: "Панель боковая правая кожуха",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Боковая панель 400x100x1.2мм, зеркальная.",
    images: [img("part-side-panel.jpg")],
    pricePerUnit: 55,
  },
  {
    id: "part-kb100-cross",
    name: "Поперечина жёсткости кожуха",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованная поперечина 380x30x1.5мм.",
    images: [img("part-cross.jpg")],
    pricePerUnit: 25,
  },

  // --- Теплозащитный экран ТЭ-200 ---
  {
    id: "part-te200-screen",
    name: "Экран теплозащитный основной",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованный алюминиевый экран 350x200x0.8мм с перфорацией. Операции: вырубка → формовка → перфорация.",
    images: [img("shields-exhaust.jpg")],
    pricePerUnit: 70,
  },
  {
    id: "part-te200-bracket",
    name: "Кронштейн крепления экрана",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Г-образный кронштейн 40x25x1мм.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 10,
  },
  {
    id: "part-te200-vibro",
    name: "Виброизолятор экрана",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованная шайба D20x0.5мм с лепестками.",
    images: [img("part-damper.jpg")],
    pricePerUnit: 6,
  },

  // --- Кожух днища КД-300 ---
  {
    id: "part-kd300-panel",
    name: "Панель защитная днища",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованная панель 600x500x1мм с рёбрами жёсткости.",
    images: [img("shields-underbody.jpg")],
    pricePerUnit: 115,
  },
  {
    id: "part-kd300-edge",
    name: "Усилитель кромки днища",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Штампованный профиль 550x20x1.2мм.",
    images: [img("part-rib.jpg")],
    pricePerUnit: 30,
  },
  {
    id: "part-kd300-tab",
    name: "Монтажный лепесток днища",
    type: "part",
    unit: "pcs",
    category: "shields",
    description: "Пластина 30x20x1мм с отверстием, 6 шт на изделие.",
    images: [img("part-strip.jpg")],
    pricePerUnit: 5,
  },

  // --- Опорная пластина подвески ОП-300 ---
  {
    id: "part-op300-plate",
    name: "Пластина опорная подвески",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Штампованная пластина 120x100x4мм с рельефом жёсткости.",
    images: [img("suspension-plate.jpg"), img("part-mounting-plate.jpg")],
    pricePerUnit: 55,
  },
  {
    id: "part-op300-washer",
    name: "Упорная шайба подвески",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Шайба D50x3мм со стопорным выступом.",
    images: [img("part-washer.jpg")],
    pricePerUnit: 12,
  },
  {
    id: "part-op300-mount",
    name: "Пластина крепления подвески",
    type: "part",
    unit: "pcs",
    category: "suspension",
    description: "Монтажная пластина 80x50x3мм.",
    images: [img("part-mounting-plate.jpg")],
    pricePerUnit: 25,
  },
];

// ============================================================
// ПОДСБОРКИ (сварные узлы из нескольких деталей)
// ============================================================
const subassemblies: NomenclatureItem[] = [
  {
    id: "sub-up100-core",
    name: "Соединитель порога (сварной узел)",
    type: "subassembly",
    unit: "pcs",
    category: "body",
    description: "Сварной узел: основание + продольное ребро. Контактная сварка 6 точек. Промежуточная подсборка для усилителя порога.",
    images: [img("body-cat.jpg"), img("body-reinforcement.jpg")],
    pricePerUnit: 45,
  },
  {
    id: "sub-cp100-pair",
    name: "Опора пружины в сборе (сварной узел)",
    type: "subassembly",
    unit: "pcs",
    category: "suspension",
    description: "Сварной узел: верхняя чашка + нижняя чашка + опорное кольцо. Контактная сварка по окружности. Промежуточная подсборка для чашки пружины.",
    images: [img("part-cup.jpg"), img("suspension-cat.jpg")],
    pricePerUnit: 60,
  },
  {
    id: "sub-kd100-frame",
    name: "Рама кронштейна двигателя (сварной узел)",
    type: "subassembly",
    unit: "pcs",
    category: "brackets",
    description: "Сварной узел: основание + 2 ребра жёсткости. Полуавтоматическая сварка. Промежуточная подсборка для кронштейна двигателя.",
    images: [img("part-flat-bracket.jpg"), img("part-gusset.jpg")],
    pricePerUnit: 50,
  },
  {
    id: "sub-kb100-box",
    name: "Короб кожуха бака (сварной узел)",
    type: "subassembly",
    unit: "pcs",
    category: "shields",
    description: "Сварной узел: нижняя панель + левая боковая + правая боковая. Контактная сварка по периметру. Промежуточная подсборка.",
    images: [img("shields-underbody.jpg"), img("shields-cat.jpg")],
    pricePerUnit: 80,
  },
];

// ============================================================
// ИЗДЕЛИЯ (готовая продукция)
// ============================================================
const products: NomenclatureItem[] = [
  {
    id: "prod-up100",
    name: "Усилитель порога УП-100",
    type: "product",
    unit: "pcs",
    category: "body",
    description: "Усилитель порога кузова. Холодная штамповка, сталь 08пс 2мм, оцинковка. Состоит из сварного соединителя, 4 поперечных рёбер и 2 монтажных пластин.",
    images: [img("body-cat.jpg"), img("body-reinforcement.jpg")],
  },
  {
    id: "prod-pp200",
    name: "Поперечина пола ПП-200",
    type: "product",
    unit: "pcs",
    category: "body",
    description: "Поперечина пола кузова. Холодная штамповка, сталь 08кп 1.5мм. Балка швеллерного профиля с косынками и опорными пластинами.",
    images: [img("body-crossmember.jpg"), img("part-cross.jpg")],
  },
  {
    id: "prod-ak300",
    name: "Арка колеса задняя АК-300",
    type: "product",
    unit: "pcs",
    category: "body",
    description: "Внутренняя арка заднего колеса. Холодная штамповка, сталь 08пс 1.2мм. Наружная панель с усилителем и соединительными пластинами.",
    images: [img("body-wheel-arch.jpg")],
  },
  {
    id: "prod-cp100",
    name: "Чашка пружины передняя ЧП-100",
    type: "product",
    unit: "pcs",
    category: "suspension",
    description: "Опорная чашка передней пружины. Холодная вытяжка, сталь 09Г2С 3мм. Сварной узел чашек с опорным кольцом и усилительной шайбой.",
    images: [img("suspension-cat.jpg"), img("part-cup.jpg")],
  },
  {
    id: "prod-ks200",
    name: "Кронштейн стабилизатора КС-200",
    type: "product",
    unit: "pcs",
    category: "suspension",
    description: "Кронштейн крепления стабилизатора поперечной устойчивости. Сталь 09Г2С 3мм. U-скоба с основанием и прижимной пластиной.",
    images: [img("suspension-stabilizer.jpg"), img("brackets-cat.jpg")],
  },
  {
    id: "prod-op300",
    name: "Опорная пластина подвески ОП-300",
    type: "product",
    unit: "pcs",
    category: "suspension",
    description: "Опорная пластина нижнего рычага. Холодная штамповка, сталь 09Г2С 4мм.",
    images: [img("suspension-plate.jpg")],
  },
  {
    id: "prod-ts100",
    name: "Тормозной щит передний ТЩ-100",
    type: "product",
    unit: "pcs",
    category: "brakes",
    description: "Пылезащитный щит переднего тормоза. Холодная штамповка, сталь 08кп 1мм. Основной диск с кожухом и кронштейном шланга.",
    images: [img("brake-cat.jpg"), img("part-dust-cover.jpg")],
  },
  {
    id: "prod-pk200",
    name: "Пластина колодочная ПК-200",
    type: "product",
    unit: "pcs",
    category: "brakes",
    description: "Противоскрипная пластина тормозных колодок. Комплект: направляющая + скоба + фиксатор. Пружинная сталь 65Г.",
    images: [img("brake-backing.jpg"), img("brake-shim.jpg")],
  },
  {
    id: "prod-ksu300",
    name: "Кронштейн суппорта КСУ-300",
    type: "product",
    unit: "pcs",
    category: "brakes",
    description: "Кронштейн крепления суппорта. Холодная штамповка, сталь 09Г2С 5мм.",
    images: [img("brackets-cat.jpg")],
  },
  {
    id: "prod-kd100",
    name: "Кронштейн двигателя КД-100",
    type: "product",
    unit: "pcs",
    category: "brackets",
    description: "Кронштейн опоры двигателя. Сварной узел рамы с чашкой опоры и монтажной площадкой. Сталь 09Г2С 4мм.",
    images: [img("brackets-cat.jpg"), img("part-flat-bracket.jpg")],
  },
  {
    id: "prod-hv200",
    name: "Хомут выхлопной системы ХВ-200",
    type: "product",
    unit: "pcs",
    category: "brackets",
    description: "Хомут крепления выхлопной трубы. Нержавейка 12Х18Н10Т 2мм. Два полухомута со стяжной пластиной.",
    images: [img("brackets-exhaust.jpg"), img("part-clamp.jpg")],
  },
  {
    id: "prod-st300",
    name: "Скоба топливопровода СТ-300",
    type: "product",
    unit: "pcs",
    category: "brackets",
    description: "Скоба крепления топливной трубки. Оцинкованная сталь 1мм. Скоба с демпферной прокладкой.",
    images: [img("brackets-fuelclip.jpg")],
  },
  {
    id: "prod-kb100",
    name: "Кожух бака защитный КБ-100",
    type: "product",
    unit: "pcs",
    category: "shields",
    description: "Защитный кожух топливного бака. Сварной короб с поперечинами жёсткости. Сталь 08пс 1.2мм.",
    images: [img("shields-cat.jpg"), img("shields-underbody.jpg")],
  },
  {
    id: "prod-te200",
    name: "Теплозащитный экран ТЭ-200",
    type: "product",
    unit: "pcs",
    category: "shields",
    description: "Теплозащитный экран выхлопной системы. Алюминий АМг2 0.8мм с перфорацией. Экран с кронштейнами и виброизоляторами.",
    images: [img("shields-exhaust.jpg")],
  },
  {
    id: "prod-kd300",
    name: "Кожух днища КД-300",
    type: "product",
    unit: "pcs",
    category: "shields",
    description: "Защита днища кузова. Сталь 08пс 1мм, оцинковка. Панель с усилителями кромки и монтажными лепестками.",
    images: [img("shields-underbody.jpg"), img("shields-cat.jpg")],
  },
];

// ============================================================
// BOM (Bill of Materials) — спецификации
// ============================================================
export const bom: BomEntry[] = [
  // === ЗАГОТОВКИ ← СЫРЬЁ (кг на 1 заготовку) ===
  { parentId: "blank-450x120-08ps-2", childId: "raw-08ps-2.0", quantity: 0.85 },
  { parentId: "blank-400x50-08ps-2", childId: "raw-08ps-2.0", quantity: 0.32 },
  { parentId: "blank-70x50-08ps-2", childId: "raw-08ps-2.0", quantity: 0.055 },
  { parentId: "blank-60x40-08ps-2", childId: "raw-08ps-2.0", quantity: 0.038 },
  { parentId: "blank-d180-09g2s-3", childId: "raw-09g2s-3.0", quantity: 0.60 },
  { parentId: "blank-d160-09g2s-3", childId: "raw-09g2s-3.0", quantity: 0.48 },
  { parentId: "blank-d340-08kp-1", childId: "raw-08kp-1.0", quantity: 0.71 },
  { parentId: "blank-180x120-09g2s-4", childId: "raw-09g2s-4.0", quantity: 0.68 },
  { parentId: "blank-100x80-09g2s-3", childId: "raw-09g2s-3.0", quantity: 0.19 },
  { parentId: "blank-550x450-08ps-1.2", childId: "raw-08ps-1.2", quantity: 2.33 },
  { parentId: "blank-400x200-amg2-0.8", childId: "raw-amg2-0.8", quantity: 0.17 },

  // === ДЕТАЛИ ← ЗАГОТОВКИ (шт) ===
  // Усилитель порога
  { parentId: "part-up100-base", childId: "blank-450x120-08ps-2", quantity: 1 },
  { parentId: "part-up100-rib-long", childId: "blank-400x50-08ps-2", quantity: 1 },
  { parentId: "part-up100-rib-cross", childId: "blank-70x50-08ps-2", quantity: 1 },
  { parentId: "part-up100-plate", childId: "blank-60x40-08ps-2", quantity: 1 },

  // Чашка пружины (из круглых заготовок)
  { parentId: "part-cp100-upper", childId: "blank-d180-09g2s-3", quantity: 1 },
  { parentId: "part-cp100-lower", childId: "blank-d160-09g2s-3", quantity: 1 },
  { parentId: "part-cp100-ring", childId: "raw-09g2s-3.0", quantity: 0.15 },
  { parentId: "part-cp100-washer", childId: "raw-09g2s-4.0", quantity: 0.09 },

  // Тормозной щит
  { parentId: "part-ts100-disc", childId: "blank-d340-08kp-1", quantity: 1 },
  { parentId: "part-ts100-cover", childId: "raw-08kp-1.0", quantity: 0.28 },
  { parentId: "part-ts100-bracket", childId: "raw-08kp-1.5", quantity: 0.01 },

  // Кронштейн двигателя
  { parentId: "part-kd100-base", childId: "blank-180x120-09g2s-4", quantity: 1 },
  { parentId: "part-kd100-rib", childId: "blank-100x80-09g2s-3", quantity: 1 },
  { parentId: "part-kd100-cup", childId: "raw-09g2s-3.0", quantity: 0.07 },
  { parentId: "part-kd100-pad", childId: "raw-09g2s-4.0", quantity: 0.15 },

  // Кожух бака
  { parentId: "part-kb100-bottom", childId: "blank-550x450-08ps-1.2", quantity: 1 },
  { parentId: "part-kb100-side-l", childId: "raw-08ps-1.2", quantity: 0.38 },
  { parentId: "part-kb100-side-r", childId: "raw-08ps-1.2", quantity: 0.38 },
  { parentId: "part-kb100-cross", childId: "raw-08kp-1.5", quantity: 0.07 },

  // Теплозащитный экран
  { parentId: "part-te200-screen", childId: "blank-400x200-amg2-0.8", quantity: 1 },
  { parentId: "part-te200-bracket", childId: "raw-oцинк-1.0", quantity: 0.008 },
  { parentId: "part-te200-vibro", childId: "raw-oцинк-1.0", quantity: 0.002 },

  // Детали без промежуточных заготовок (напрямую из сырья)
  // Поперечина пола
  { parentId: "part-pp200-beam", childId: "raw-08kp-1.5", quantity: 0.56 },
  { parentId: "part-pp200-gusset-l", childId: "raw-08kp-1.5", quantity: 0.075 },
  { parentId: "part-pp200-gusset-r", childId: "raw-08kp-1.5", quantity: 0.075 },
  { parentId: "part-pp200-support", childId: "raw-08ps-2.0", quantity: 0.094 },

  // Арка колеса
  { parentId: "part-ak300-panel", childId: "raw-08ps-1.2", quantity: 2.26 },
  { parentId: "part-ak300-reinf", childId: "raw-08kp-1.5", quantity: 0.47 },
  { parentId: "part-ak300-joint", childId: "raw-08ps-1.2", quantity: 0.085 },

  // Кронштейн стабилизатора
  { parentId: "part-ks200-clamp", childId: "raw-09g2s-3.0", quantity: 0.064 },
  { parentId: "part-ks200-base", childId: "raw-09g2s-3.0", quantity: 0.11 },
  { parentId: "part-ks200-press", childId: "raw-08ps-2.0", quantity: 0.038 },

  // Пластина колодочная (пружинная сталь)
  { parentId: "part-pk200-shim", childId: "raw-65g-0.5", quantity: 0.016 },
  { parentId: "part-pk200-clip", childId: "raw-65g-0.5", quantity: 0.005 },
  { parentId: "part-pk200-lock", childId: "raw-65g-0.5", quantity: 0.002 },

  // Кронштейн суппорта
  { parentId: "part-ksu300-body", childId: "raw-09g2s-5.0", quantity: 1.88 },
  { parentId: "part-ksu300-plate", childId: "raw-09g2s-3.0", quantity: 0.056 },

  // Хомут выхлопной (нержавейка)
  { parentId: "part-hv200-upper", childId: "raw-12x18-2.0", quantity: 0.11 },
  { parentId: "part-hv200-lower", childId: "raw-12x18-2.0", quantity: 0.14 },
  { parentId: "part-hv200-strap", childId: "raw-12x18-2.0", quantity: 0.013 },

  // Скоба топливопровода (оцинковка)
  { parentId: "part-st300-clip", childId: "raw-oцинк-1.0", quantity: 0.004 },
  { parentId: "part-st300-damper", childId: "raw-oцинк-1.0", quantity: 0.001 },

  // Опорная пластина подвески
  { parentId: "part-op300-plate", childId: "raw-09g2s-4.0", quantity: 0.38 },
  { parentId: "part-op300-washer", childId: "raw-09g2s-3.0", quantity: 0.046 },
  { parentId: "part-op300-mount", childId: "raw-09g2s-3.0", quantity: 0.094 },

  // Кожух днища
  { parentId: "part-kd300-panel", childId: "raw-08kp-1.0", quantity: 2.36 },
  { parentId: "part-kd300-edge", childId: "raw-08ps-1.2", quantity: 0.10 },
  { parentId: "part-kd300-tab", childId: "raw-oцинк-1.0", quantity: 0.002 },

  // === ПОДСБОРКИ ← ДЕТАЛИ ===
  // Соединитель порога = основание + продольное ребро
  { parentId: "sub-up100-core", childId: "part-up100-base", quantity: 1 },
  { parentId: "sub-up100-core", childId: "part-up100-rib-long", quantity: 1 },

  // Опора пружины в сборе = верхняя чашка + нижняя чашка + кольцо
  { parentId: "sub-cp100-pair", childId: "part-cp100-upper", quantity: 1 },
  { parentId: "sub-cp100-pair", childId: "part-cp100-lower", quantity: 1 },
  { parentId: "sub-cp100-pair", childId: "part-cp100-ring", quantity: 1 },

  // Рама кронштейна двигателя = основание + 2 ребра
  { parentId: "sub-kd100-frame", childId: "part-kd100-base", quantity: 1 },
  { parentId: "sub-kd100-frame", childId: "part-kd100-rib", quantity: 2 },

  // Короб кожуха бака = нижняя панель + левая + правая боковые
  { parentId: "sub-kb100-box", childId: "part-kb100-bottom", quantity: 1 },
  { parentId: "sub-kb100-box", childId: "part-kb100-side-l", quantity: 1 },
  { parentId: "sub-kb100-box", childId: "part-kb100-side-r", quantity: 1 },

  // === ИЗДЕЛИЯ ← ПОДСБОРКИ + ДЕТАЛИ + МЕТИЗЫ ===

  // Усилитель порога УП-100:
  //   соединитель (подсборка) x1 + поперечные рёбра x4 + монтажные пластины x2 + заклёпки x8
  { parentId: "prod-up100", childId: "sub-up100-core", quantity: 1 },
  { parentId: "prod-up100", childId: "part-up100-rib-cross", quantity: 4 },
  { parentId: "prod-up100", childId: "part-up100-plate", quantity: 2 },
  { parentId: "prod-up100", childId: "raw-rivets-4.8", quantity: 8 },

  // Поперечина пола ПП-200:
  //   балка x1 + косынка лев. x1 + косынка прав. x1 + опорные пластины x2
  { parentId: "prod-pp200", childId: "part-pp200-beam", quantity: 1 },
  { parentId: "prod-pp200", childId: "part-pp200-gusset-l", quantity: 1 },
  { parentId: "prod-pp200", childId: "part-pp200-gusset-r", quantity: 1 },
  { parentId: "prod-pp200", childId: "part-pp200-support", quantity: 2 },

  // Арка колеса АК-300:
  //   наружная панель x1 + усилитель x1 + соединительная пластина x2
  { parentId: "prod-ak300", childId: "part-ak300-panel", quantity: 1 },
  { parentId: "prod-ak300", childId: "part-ak300-reinf", quantity: 1 },
  { parentId: "prod-ak300", childId: "part-ak300-joint", quantity: 2 },

  // Чашка пружины ЧП-100:
  //   опора в сборе (подсборка) x1 + усилительная шайба x1
  { parentId: "prod-cp100", childId: "sub-cp100-pair", quantity: 1 },
  { parentId: "prod-cp100", childId: "part-cp100-washer", quantity: 1 },

  // Кронштейн стабилизатора КС-200:
  //   скоба x1 + основание x1 + прижимная пластина x1 + болты x2 + гайки x2 + шайбы x2
  { parentId: "prod-ks200", childId: "part-ks200-clamp", quantity: 1 },
  { parentId: "prod-ks200", childId: "part-ks200-base", quantity: 1 },
  { parentId: "prod-ks200", childId: "part-ks200-press", quantity: 1 },
  { parentId: "prod-ks200", childId: "raw-bolts-m8", quantity: 2 },
  { parentId: "prod-ks200", childId: "raw-nuts-m8", quantity: 2 },
  { parentId: "prod-ks200", childId: "raw-washers-m8", quantity: 2 },

  // Опорная пластина подвески ОП-300:
  //   пластина опорная x1 + упорная шайба x1 + пластина крепления x1 + болты x2 + гайки x2
  { parentId: "prod-op300", childId: "part-op300-plate", quantity: 1 },
  { parentId: "prod-op300", childId: "part-op300-washer", quantity: 1 },
  { parentId: "prod-op300", childId: "part-op300-mount", quantity: 1 },
  { parentId: "prod-op300", childId: "raw-bolts-m8", quantity: 2 },
  { parentId: "prod-op300", childId: "raw-nuts-m8", quantity: 2 },

  // Тормозной щит ТЩ-100:
  //   щит x1 + кожух x1 + кронштейн шланга x1 + заклёпки x4
  { parentId: "prod-ts100", childId: "part-ts100-disc", quantity: 1 },
  { parentId: "prod-ts100", childId: "part-ts100-cover", quantity: 1 },
  { parentId: "prod-ts100", childId: "part-ts100-bracket", quantity: 1 },
  { parentId: "prod-ts100", childId: "raw-rivets-4.8", quantity: 4 },

  // Пластина колодочная ПК-200 (комплект):
  //   направляющая x2 + скоба x2 + фиксатор x2
  { parentId: "prod-pk200", childId: "part-pk200-shim", quantity: 2 },
  { parentId: "prod-pk200", childId: "part-pk200-clip", quantity: 2 },
  { parentId: "prod-pk200", childId: "part-pk200-lock", quantity: 2 },

  // Кронштейн суппорта КСУ-300:
  //   корпус x1 + упорная пластина x1 + болты x2 + шайбы x2
  { parentId: "prod-ksu300", childId: "part-ksu300-body", quantity: 1 },
  { parentId: "prod-ksu300", childId: "part-ksu300-plate", quantity: 1 },
  { parentId: "prod-ksu300", childId: "raw-bolts-m8", quantity: 2 },
  { parentId: "prod-ksu300", childId: "raw-washers-m8", quantity: 2 },

  // Кронштейн двигателя КД-100:
  //   рама (подсборка) x1 + чашка опоры x1 + монтажная площадка x1 + болты x4 + гайки x4 + шайбы x4
  { parentId: "prod-kd100", childId: "sub-kd100-frame", quantity: 1 },
  { parentId: "prod-kd100", childId: "part-kd100-cup", quantity: 1 },
  { parentId: "prod-kd100", childId: "part-kd100-pad", quantity: 1 },
  { parentId: "prod-kd100", childId: "raw-bolts-m8", quantity: 4 },
  { parentId: "prod-kd100", childId: "raw-nuts-m8", quantity: 4 },
  { parentId: "prod-kd100", childId: "raw-washers-m8", quantity: 4 },

  // Хомут выхлопной ХВ-200:
  //   верхний полухомут x1 + нижний полухомут x1 + стяжная пластина x2 + болты x2 + гайки x2
  { parentId: "prod-hv200", childId: "part-hv200-upper", quantity: 1 },
  { parentId: "prod-hv200", childId: "part-hv200-lower", quantity: 1 },
  { parentId: "prod-hv200", childId: "part-hv200-strap", quantity: 2 },
  { parentId: "prod-hv200", childId: "raw-bolts-m8", quantity: 2 },
  { parentId: "prod-hv200", childId: "raw-nuts-m8", quantity: 2 },

  // Скоба топливопровода СТ-300:
  //   скоба x1 + демпферная прокладка x1
  { parentId: "prod-st300", childId: "part-st300-clip", quantity: 1 },
  { parentId: "prod-st300", childId: "part-st300-damper", quantity: 1 },

  // Кожух бака КБ-100:
  //   короб (подсборка) x1 + поперечины x2 + болты x6 + шайбы x6
  { parentId: "prod-kb100", childId: "sub-kb100-box", quantity: 1 },
  { parentId: "prod-kb100", childId: "part-kb100-cross", quantity: 2 },
  { parentId: "prod-kb100", childId: "raw-bolts-m8", quantity: 6 },
  { parentId: "prod-kb100", childId: "raw-washers-m8", quantity: 6 },

  // Теплозащитный экран ТЭ-200:
  //   экран x1 + кронштейны x3 + виброизоляторы x4 + заклёпки x6
  { parentId: "prod-te200", childId: "part-te200-screen", quantity: 1 },
  { parentId: "prod-te200", childId: "part-te200-bracket", quantity: 3 },
  { parentId: "prod-te200", childId: "part-te200-vibro", quantity: 4 },
  { parentId: "prod-te200", childId: "raw-rivets-4.8", quantity: 6 },

  // Кожух днища КД-300:
  //   панель x1 + усилитель кромки x2 + лепестки x6 + заклёпки x12
  { parentId: "prod-kd300", childId: "part-kd300-panel", quantity: 1 },
  { parentId: "prod-kd300", childId: "part-kd300-edge", quantity: 2 },
  { parentId: "prod-kd300", childId: "part-kd300-tab", quantity: 6 },
  { parentId: "prod-kd300", childId: "raw-rivets-4.8", quantity: 12 },
];

// ============================================================
// Общий справочник
// ============================================================
export const allItems: NomenclatureItem[] = [
  ...materials,
  ...blanks,
  ...parts,
  ...subassemblies,
  ...products,
];

// Хелперы
export function getItem(id: string): NomenclatureItem | undefined {
  return allItems.find((i) => i.id === id);
}

export function getChildren(parentId: string): { item: NomenclatureItem; quantity: number }[] {
  return bom
    .filter((b) => b.parentId === parentId)
    .map((b) => ({ item: getItem(b.childId)!, quantity: b.quantity }))
    .filter((b) => b.item);
}

export function getParents(childId: string): { item: NomenclatureItem; quantity: number }[] {
  return bom
    .filter((b) => b.childId === childId)
    .map((b) => ({ item: getItem(b.parentId)!, quantity: b.quantity }))
    .filter((b) => b.item);
}

export function getItemsByType(type: ItemType): NomenclatureItem[] {
  return allItems.filter((i) => i.type === type);
}

export function getItemsByCategory(categoryId: string): NomenclatureItem[] {
  return allItems.filter((i) => i.category === categoryId);
}
