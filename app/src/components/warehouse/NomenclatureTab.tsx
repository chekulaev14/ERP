"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BomView } from "./BomView";
import {
  type NomenclatureItem,
  type ItemType,
  itemTypeLabels,
  unitLabels,
  categories,
} from "@/data/nomenclature";

interface Props {
  items: NomenclatureItem[];
  balances: Record<string, number>;
}

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-900/50 text-amber-300 border-amber-700",
  blank: "bg-orange-900/50 text-orange-300 border-orange-700",
  part: "bg-blue-900/50 text-blue-300 border-blue-700",
  subassembly: "bg-purple-900/50 text-purple-300 border-purple-700",
  product: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
};

const typeOrder: ItemType[] = ["product", "subassembly", "part", "blank", "material"];

export function NomenclatureTab({ items, balances }: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [navStack, setNavStack] = useState<NomenclatureItem[]>([]);

  const selectedItem = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const handleNavigate = (item: NomenclatureItem) => {
    setNavStack((prev) => [...prev, item]);
  };

  const handleBreadcrumb = (index: number) => {
    setNavStack((prev) => prev.slice(0, index + 1));
  };

  const handleBackToList = () => {
    setNavStack([]);
  };

  const filtered = useMemo(() => {
    let result = items;

    if (filterType !== "all") {
      result = result.filter((i) => i.type === filterType);
    }

    if (filterCategory !== "all") {
      result = result.filter((i) => i.category === filterCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    // Сортировка: изделия → подсборки → детали → заготовки → сырьё
    result.sort((a, b) => {
      const ai = typeOrder.indexOf(a.type);
      const bi = typeOrder.indexOf(b.type);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name, "ru");
    });

    return result;
  }, [items, search, filterType, filterCategory]);

  if (selectedItem) {
    return (
      <div>
        {/* Хлебные крошки */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          <button
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            onClick={handleBackToList}
          >
            Номенклатура
          </button>
          {navStack.map((item, i) => (
            <span key={`${item.id}-${i}`} className="flex items-center gap-1">
              <span className="text-muted-foreground/50 text-xs">/</span>
              {i < navStack.length - 1 ? (
                <button
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                  onClick={() => handleBreadcrumb(i)}
                >
                  {item.name}
                </button>
              ) : (
                <span className="text-foreground text-xs font-medium">{item.name}</span>
              )}
            </span>
          ))}
        </div>
        <BomView item={selectedItem} balances={balances} onNavigate={handleNavigate} items={items} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Поиск по названию, ID, описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground text-xs h-8 max-w-xs"
        />

        <div className="flex gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs h-7 px-2 ${filterType === "all" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            onClick={() => setFilterType("all")}
          >
            Все
          </Button>
          {typeOrder.map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-2 ${filterType === t ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              onClick={() => setFilterType(t)}
            >
              {itemTypeLabels[t]}
            </Button>
          ))}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-card border border-border text-muted-foreground text-xs rounded px-2 h-7"
        >
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="">Без категории</option>
        </select>
      </div>

      <p className="text-muted-foreground/70 text-xs">{filtered.length} позиций</p>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-medium h-8">Наименование</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium h-8 w-24">Тип</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium h-8 w-20 text-right">Остаток</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium h-8 w-12 text-right">Ед.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow
                key={item.id}
                className="border-border/50 cursor-pointer hover:bg-accent/50"
                onClick={() => handleNavigate(item)}
              >
                <TableCell className="py-1.5">
                  <div>
                    <p className="text-foreground text-xs font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-muted-foreground/70 text-[10px] mt-0.5 line-clamp-1 max-w-md">
                        {item.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[item.type]}`}>
                    {itemTypeLabels[item.type]}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <span className="text-foreground text-xs font-mono">
                    {formatNumber(balances[item.id] ?? 0)}
                  </span>
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <span className="text-muted-foreground/70 text-xs">{unitLabels[item.unit]}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("ru-RU");
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 3 });
}
