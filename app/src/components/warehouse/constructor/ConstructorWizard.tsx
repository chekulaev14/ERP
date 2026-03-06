"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TreePreview } from "./TreePreview";
import {
  type ItemType,
  itemTypeLabels,
  unitLabels,
} from "@/data/nomenclature";

// Типы для wizard state
export interface ConstructorItem {
  tempId: string;
  existingId?: string; // если выбрана существующая позиция из базы
  name: string;
  unit: string;
  description: string;
  pricePerUnit: string;
  quantity: string;
  parentTempId: string;
}

interface ProductData {
  name: string;
  unit: string;
  description: string;
}

interface DbItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  category: string | null;
  description: string | null;
  pricePerUnit: number | null;
}

// Порядок типов для группировки
const typeOrder: ItemType[] = ["material", "blank", "part", "subassembly", "product"];

const STEPS: { type: ItemType; label: string; parentType: string }[] = [
  { type: "product", label: "Изделие", parentType: "" },
  { type: "subassembly", label: "Подсборки", parentType: "Изделие" },
  { type: "part", label: "Детали", parentType: "Подсборка / Изделие" },
  { type: "blank", label: "Заготовки", parentType: "Деталь" },
  { type: "material", label: "Сырьё", parentType: "Заготовка" },
];

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-100 text-amber-800 border-amber-300",
  blank: "bg-orange-100 text-orange-800 border-orange-300",
  part: "bg-blue-100 text-blue-800 border-blue-300",
  subassembly: "bg-purple-100 text-purple-800 border-purple-300",
  product: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

let tempIdCounter = 0;
function nextTempId() {
  return `temp-${++tempIdCounter}`;
}

export function ConstructorWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<ProductData>({
    name: "",
    unit: "pcs",
    description: "",
  });
  const [productTempId] = useState(() => nextTempId());

  const [subassemblies, setSubassemblies] = useState<ConstructorItem[]>([]);
  const [parts, setParts] = useState<ConstructorItem[]>([]);
  const [blanks, setBlanks] = useState<ConstructorItem[]>([]);
  const [materials, setMaterials] = useState<ConstructorItem[]>([]);

  const itemsByStep = [null, subassemblies, parts, blanks, materials];
  const settersByStep = [null, setSubassemblies, setParts, setBlanks, setMaterials];

  const getParentOptions = useCallback(
    (stepIndex: number): { tempId: string; name: string; type: ItemType }[] => {
      if (stepIndex === 1) {
        return product.name
          ? [{ tempId: productTempId, name: product.name, type: "product" }]
          : [];
      }
      if (stepIndex === 2) {
        const options: { tempId: string; name: string; type: ItemType }[] = [];
        if (product.name) {
          options.push({ tempId: productTempId, name: product.name, type: "product" });
        }
        subassemblies.forEach((s) => {
          if (s.name) options.push({ tempId: s.tempId, name: s.name, type: "subassembly" });
        });
        return options;
      }
      if (stepIndex === 3) {
        return parts
          .filter((p) => p.name)
          .map((p) => ({ tempId: p.tempId, name: p.name, type: "part" }));
      }
      if (stepIndex === 4) {
        return blanks
          .filter((b) => b.name)
          .map((b) => ({ tempId: b.tempId, name: b.name, type: "blank" }));
      }
      return [];
    },
    [product, productTempId, subassemblies, parts, blanks]
  );

  const addItem = (stepIndex: number) => {
    const parentOptions = getParentOptions(stepIndex);
    const newItem: ConstructorItem = {
      tempId: nextTempId(),
      name: "",
      unit: "pcs",
      description: "",
      pricePerUnit: "",
      quantity: "1",
      parentTempId: parentOptions.length === 1 ? parentOptions[0].tempId : "",
    };
    const setter = settersByStep[stepIndex];
    if (setter) setter((prev) => [newItem, ...prev]);
  };

  const updateItem = (stepIndex: number, tempId: string, field: keyof ConstructorItem, value: string) => {
    const setter = settersByStep[stepIndex];
    if (setter) {
      setter((prev) =>
        prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
      );
    }
  };

  const selectExistingItem = (stepIndex: number, tempId: string, dbItem: DbItem) => {
    const setter = settersByStep[stepIndex];
    if (setter) {
      setter((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? {
                ...item,
                existingId: dbItem.id,
                name: dbItem.name,
                unit: dbItem.unit,
                description: dbItem.description || "",
                pricePerUnit: dbItem.pricePerUnit?.toString() || "",
              }
            : item
        )
      );
    }
  };

  const clearExistingItem = (stepIndex: number, tempId: string) => {
    const setter = settersByStep[stepIndex];
    if (setter) {
      setter((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? { ...item, existingId: undefined, name: "", unit: "pcs", description: "", pricePerUnit: "" }
            : item
        )
      );
    }
  };

  const removeItem = (stepIndex: number, tempId: string) => {
    const setter = settersByStep[stepIndex];
    if (setter) setter((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const canGoNext = () => {
    if (step === 0) return product.name.trim().length > 0;
    if (step >= 1 && step <= 4) {
      const items = itemsByStep[step];
      if (!items || items.length === 0) return true;
      const filledItems = items.filter((i) => i.name.trim());
      if (filledItems.length === 0) return true;
      return filledItems.every((i) => i.parentTempId);
    }
    return true;
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");

    const allComponents = [
      ...subassemblies.filter((i) => i.name.trim()),
      ...parts.filter((i) => i.name.trim()),
      ...blanks.filter((i) => i.name.trim()),
      ...materials.filter((i) => i.name.trim()),
    ];

    // Собираем type для каждого компонента
    const typeMap = new Map<string, ItemType>();
    subassemblies.forEach((i) => typeMap.set(i.tempId, "subassembly"));
    parts.forEach((i) => typeMap.set(i.tempId, "part"));
    blanks.forEach((i) => typeMap.set(i.tempId, "blank"));
    materials.forEach((i) => typeMap.set(i.tempId, "material"));

    const payload = {
      product: {
        name: product.name,
        unit: product.unit,
        description: product.description,
      },
      components: allComponents.map((c) => ({
        tempId: c.tempId,
        parentTempId: c.parentTempId === productTempId ? "product" : c.parentTempId,
        existingId: c.existingId,
        name: c.name,
        type: typeMap.get(c.tempId) || "material",
        unit: c.unit,
        description: c.description || undefined,
        pricePerUnit: c.pricePerUnit ? Number(c.pricePerUnit) : undefined,
        quantity: Number(c.quantity) || 1,
      })),
    };

    try {
      const res = await fetch("/api/product-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка сервера");
      }

      router.push("/warehouse");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.type} className="flex items-center">
            <button
              onClick={() => (i <= step || step === 5) && setStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                i === step
                  ? "bg-foreground text-background font-medium"
                  : i < step
                  ? "bg-accent text-foreground cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                  ? "bg-background text-foreground"
                  : "bg-muted-foreground/30 text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${i < step ? "bg-emerald-500" : "bg-border"}`} />
            )}
          </div>
        ))}
        <div className="flex items-center">
          <div className={`w-4 h-px mx-0.5 ${step === 5 ? "bg-emerald-500" : "bg-border"}`} />
          <button
            onClick={() => step === 5 && setStep(5)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
              step === 5
                ? "bg-foreground text-background font-medium"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 5 ? "bg-background text-foreground" : "bg-muted-foreground/30 text-muted-foreground"
            }`}>
              6
            </span>
            Итог
          </button>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push("/warehouse")}
          >
            Отмена
          </Button>
          {step > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setStep(step - 1)}
            >
              Назад
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {step >= 1 && step <= 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setStep(step + 1)}
            >
              Пропустить
            </Button>
          )}

          {step < 5 && (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
            >
              Далее
            </Button>
          )}

          {step === 5 && (
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Создание..." : "Создать изделие"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {step === 0 && (
            <ProductStep
              product={product}
              setProduct={setProduct}
            />
          )}

          {step >= 1 && step <= 4 && (
            <ItemsStep
              step={step}
              stepInfo={STEPS[step]}
              items={itemsByStep[step]!}
              parentOptions={getParentOptions(step)}
              typeColors={typeColors}
              onAdd={() => addItem(step)}
              onUpdate={(tempId, field, value) => updateItem(step, tempId, field, value)}
              onSelectExisting={(tempId, dbItem) => selectExistingItem(step, tempId, dbItem)}
              onClearExisting={(tempId) => clearExistingItem(step, tempId)}
              onRemove={(tempId) => removeItem(step, tempId)}
            />
          )}

          {step === 5 && (
            <SummaryStep
              product={product}
              productTempId={productTempId}
              subassemblies={subassemblies}
              parts={parts}
              blanks={blanks}
              materials={materials}
              typeColors={typeColors}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Структура изделия</p>
            <div className="rounded-lg border border-border bg-card p-3">
              <TreePreview
                product={product}
                productTempId={productTempId}
                subassemblies={subassemblies}
                parts={parts}
                blanks={blanks}
                materials={materials}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Поиск по базе ---

function useDbSearch() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch("/api/nomenclature");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.items || []).sort((a: DbItem, b: DbItem) =>
          a.name.localeCompare(b.name, "ru")
        );
        setAllItems(sorted);
        setLoaded(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const isSearching = query.trim().length > 0;

  // При поиске — плоский алфавитный список
  const filtered = isSearching
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Без поиска — группировка по типам номенклатуры
  const grouped = isSearching
    ? null
    : (() => {
        const byType = new Map<string, DbItem[]>();
        filtered.forEach((item) => {
          if (!byType.has(item.type)) byType.set(item.type, []);
          byType.get(item.type)!.push(item);
        });

        const groups: { type: ItemType; label: string; items: DbItem[] }[] = [];
        typeOrder.forEach((t) => {
          const items = byType.get(t);
          if (items && items.length > 0) {
            groups.push({ type: t, label: itemTypeLabels[t], items });
          }
        });
        return groups;
      })();

  return { query, setQuery, filtered, grouped, isSearching, loading, load };
}

// --- Подкомпоненты шагов ---

function ProductStep({
  product,
  setProduct,
}: {
  product: ProductData;
  setProduct: (p: ProductData) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Новое изделие</p>
        <p className="text-xs text-muted-foreground">Заполните основную информацию об изделии</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Название *</label>
          <Input
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Например: Кронштейн левый"
            className="h-9 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Единица измерения</label>
          <Select value={product.unit} onValueChange={(v) => setProduct({ ...product, unit: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(unitLabels).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-sm">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
          <Input
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            placeholder="Краткое описание изделия"
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function ItemsStep({
  step,
  stepInfo,
  items,
  parentOptions,
  typeColors,
  onAdd,
  onUpdate,
  onSelectExisting,
  onClearExisting,
  onRemove,
}: {
  step: number;
  stepInfo: { type: ItemType; label: string; parentType: string };
  items: ConstructorItem[];
  parentOptions: { tempId: string; name: string; type: ItemType }[];
  typeColors: Record<ItemType, string>;
  onAdd: () => void;
  onUpdate: (tempId: string, field: keyof ConstructorItem, value: string) => void;
  onSelectExisting: (tempId: string, dbItem: DbItem) => void;
  onClearExisting: (tempId: string) => void;
  onRemove: (tempId: string) => void;
}) {
  const singleParent = parentOptions.length === 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{stepInfo.label}</p>
            <Badge variant="outline" className={`text-xs px-2 py-0 ${typeColors[stepInfo.type]}`}>
              {itemTypeLabels[stepInfo.type]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Добавьте позиции или пропустите шаг. Входят в: {stepInfo.parentType}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onAdd}>
          + Добавить
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Нет добавленных позиций</p>
          <p className="text-xs text-muted-foreground mt-1">
            Нажмите «Добавить» или «Пропустить»
          </p>
        </div>
      )}

      {items.map((item, idx) => (
        <ItemCard
          key={item.tempId}
          item={item}
          idx={idx}
          stepInfo={stepInfo}
          singleParent={singleParent}
          parentOptions={parentOptions}
          typeColors={typeColors}
          onUpdate={onUpdate}
          onSelectExisting={onSelectExisting}
          onClearExisting={onClearExisting}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function DbItemButton({ dbItem, onClick }: { dbItem: DbItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
    >
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[dbItem.type as ItemType] || ""}`}>
        {itemTypeLabels[dbItem.type as ItemType] || dbItem.type}
      </Badge>
      <span className="truncate">{dbItem.name}</span>
    </button>
  );
}

function ItemCard({
  item,
  idx,
  stepInfo,
  singleParent,
  parentOptions,
  typeColors,
  onUpdate,
  onSelectExisting,
  onClearExisting,
  onRemove,
}: {
  item: ConstructorItem;
  idx: number;
  stepInfo: { type: ItemType; label: string; parentType: string };
  singleParent: boolean;
  parentOptions: { tempId: string; name: string; type: ItemType }[];
  typeColors: Record<ItemType, string>;
  onUpdate: (tempId: string, field: keyof ConstructorItem, value: string) => void;
  onSelectExisting: (tempId: string, dbItem: DbItem) => void;
  onClearExisting: (tempId: string) => void;
  onRemove: (tempId: string) => void;
}) {
  const { query, setQuery, filtered, grouped, isSearching, loading, load } = useDbSearch();
  const [showSearch, setShowSearch] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const toggleSearch = () => {
    const next = !showSearch;
    setShowSearch(next);
    if (next) load();
  };

  const toggleCat = (catId: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectItem = (dbItem: DbItem) => {
    onSelectExisting(item.tempId, dbItem);
    setShowSearch(false);
    setQuery("");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {stepInfo.label} #{idx + 1}
          </span>
          {item.existingId && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-300">
              из базы
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!item.existingId && (
            <button
              onClick={toggleSearch}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showSearch ? "Скрыть поиск" : "Из базы"}
            </button>
          )}
          {item.existingId && (
            <button
              onClick={() => {
                onClearExisting(item.tempId);
                setShowSearch(false);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Создать новую
            </button>
          )}
          <button
            onClick={() => onRemove(item.tempId)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>

      {showSearch && !item.existingId && (
        <div className="rounded-lg border border-border bg-muted/50 p-2 space-y-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="h-8 text-sm"
          />
          {loading && <p className="text-xs text-muted-foreground">Загрузка...</p>}

          {/* При поиске — плоский алфавитный список */}
          {!loading && isSearching && filtered.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.map((dbItem) => (
                <DbItemButton key={dbItem.id} dbItem={dbItem} onClick={() => selectItem(dbItem)} />
              ))}
            </div>
          )}

          {/* Без поиска — группировка по типам номенклатуры */}
          {!loading && !isSearching && grouped && grouped.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {grouped.map((group) => {
                const isOpen = openCats.has(group.type);
                return (
                  <div key={group.type}>
                    <button
                      onClick={() => toggleCat(group.type)}
                      className="w-full text-left px-2 py-1.5 rounded text-xs font-medium text-foreground hover:bg-accent transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[group.type]}`}>
                          {group.label}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">{isOpen ? "▾" : "▸"} {group.items.length}</span>
                    </button>
                    {isOpen && (
                      <div className="pl-2 space-y-0.5">
                        {group.items.map((dbItem) => (
                          <DbItemButton key={dbItem.id} dbItem={dbItem} onClick={() => selectItem(dbItem)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && isSearching && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">Ничего не найдено</p>
          )}
          {!loading && !isSearching && (!grouped || grouped.length === 0) && (
            <p className="text-xs text-muted-foreground">База пуста</p>
          )}
        </div>
      )}

      {item.existingId ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[stepInfo.type]}`}>
              {itemTypeLabels[stepInfo.type]}
            </Badge>
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-xs text-muted-foreground">ID: {item.existingId.slice(0, 8)}...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="sm:col-span-2">
            <Input
              value={item.name}
              onChange={(e) => onUpdate(item.tempId, "name", e.target.value)}
              placeholder="Название"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Select
              value={item.unit}
              onValueChange={(v) => onUpdate(item.tempId, "unit", v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(unitLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              value={item.pricePerUnit}
              onChange={(e) => onUpdate(item.tempId, "pricePerUnit", e.target.value)}
              placeholder="Расценка, ₽"
              className="h-8 text-sm"
              type="number"
              min="0"
              step="0.01"
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              value={item.description}
              onChange={(e) => onUpdate(item.tempId, "description", e.target.value)}
              placeholder="Описание"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Количество и родитель — показываем всегда */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Кол-во на 1 ед. родителя</label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate(item.tempId, "quantity", e.target.value)}
            placeholder="Кол-во"
            className="h-8 text-sm"
            min="0.01"
            step="0.01"
          />
        </div>

        {!singleParent && parentOptions.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Входит в</label>
            <Select
              value={item.parentTempId || undefined}
              onValueChange={(v) => onUpdate(item.tempId, "parentTempId", v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Выберите родителя" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((p) => (
                  <SelectItem key={p.tempId} value={p.tempId} className="text-sm">
                    [{itemTypeLabels[p.type]}] {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStep({
  product,
  productTempId,
  subassemblies,
  parts,
  blanks,
  materials,
  typeColors,
}: {
  product: ProductData;
  productTempId: string;
  subassemblies: ConstructorItem[];
  parts: ConstructorItem[];
  blanks: ConstructorItem[];
  materials: ConstructorItem[];
  typeColors: Record<ItemType, string>;
}) {
  const allItems = [
    ...subassemblies.filter((i) => i.name),
    ...parts.filter((i) => i.name),
    ...blanks.filter((i) => i.name),
    ...materials.filter((i) => i.name),
  ];

  const newItems = allItems.filter((i) => !i.existingId);
  const existingItems = allItems.filter((i) => i.existingId);

  const counts = {
    subassembly: subassemblies.filter((i) => i.name).length,
    part: parts.filter((i) => i.name).length,
    blank: blanks.filter((i) => i.name).length,
    material: materials.filter((i) => i.name).length,
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Итоговая сводка</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Проверьте структуру перед созданием
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["subassembly", "part", "blank", "material"] as const).map((type) => (
          <div key={type} className="rounded-lg border border-border bg-card p-2.5 text-center">
            <p className="text-lg font-semibold text-foreground">{counts[type]}</p>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[type]}`}>
              {itemTypeLabels[type]}
            </Badge>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`text-xs px-2 py-0 ${typeColors.product}`}>
            {itemTypeLabels.product}
          </Badge>
          <span className="text-sm font-medium text-foreground">{product.name}</span>
          <span className="text-xs text-muted-foreground">
            ({unitLabels[product.unit as keyof typeof unitLabels]})
          </span>
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground">{product.description}</p>
        )}
      </div>

      {allItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Не добавлено ни одного компонента. Изделие будет создано без BOM-связей.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Будет создано: 1 изделие, {newItems.length} новых компонентов, {existingItems.length} привязано из базы, {allItems.length} BOM-связей.
      </p>
    </div>
  );
}
