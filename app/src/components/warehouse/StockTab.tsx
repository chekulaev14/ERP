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
import {
  type NomenclatureItem,
  type ItemType,
  itemTypeLabels,
  unitLabels,
  categories,
  bom,
  getChildren,
} from "@/data/nomenclature";

interface Props {
  items: NomenclatureItem[];
  balances: Record<string, number>;
  onRefresh: () => void;
}

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-900/50 text-amber-300 border-amber-700",
  blank: "bg-orange-900/50 text-orange-300 border-orange-700",
  part: "bg-blue-900/50 text-blue-300 border-blue-700",
  subassembly: "bg-purple-900/50 text-purple-300 border-purple-700",
  product: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
};

export function StockTab({ items, balances, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [showAssembly, setShowAssembly] = useState(false);

  // Расчёт сколько можно собрать для каждого изделия/подсборки
  const assemblyCapacity = useMemo(() => {
    const result: Record<string, number> = {};
    const assemblyItems = items.filter(
      (i) => i.type === "product" || i.type === "subassembly"
    );

    for (const item of assemblyItems) {
      const children = getChildren(item.id);
      if (children.length === 0) {
        result[item.id] = 0;
        continue;
      }

      let minCan = Infinity;
      for (const child of children) {
        const available = balances[child.item.id] ?? 0;
        const canMake = child.quantity > 0 ? Math.floor(available / child.quantity) : 0;
        minCan = Math.min(minCan, canMake);
      }
      result[item.id] = minCan === Infinity ? 0 : minCan;
    }
    return result;
  }, [items, balances]);

  // Дефицит для каждого изделия
  const shortages = useMemo(() => {
    const result: Record<string, { name: string; needed: number; available: number }[]> = {};
    const assemblyItems = items.filter(
      (i) => i.type === "product" || i.type === "subassembly"
    );

    for (const item of assemblyItems) {
      const children = getChildren(item.id);
      const shorts: { name: string; needed: number; available: number }[] = [];
      for (const child of children) {
        const available = balances[child.item.id] ?? 0;
        if (available < child.quantity) {
          shorts.push({
            name: child.item.name,
            needed: child.quantity,
            available,
          });
        }
      }
      if (shorts.length > 0) {
        result[item.id] = shorts;
      }
    }
    return result;
  }, [items, balances]);

  const filtered = useMemo(() => {
    let result = items;

    if (filterType !== "all") {
      result = result.filter((i) => i.type === filterType);
    }

    if (showZeroOnly) {
      result = result.filter((i) => (balances[i.id] ?? 0) === 0);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, search, filterType, showZeroOnly, balances]);

  if (showAssembly) {
    const assemblyItems = items.filter(
      (i) => i.type === "product" || i.type === "subassembly"
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground text-sm font-medium">Возможность сборки</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs h-7"
            onClick={() => setShowAssembly(false)}
          >
            ← Назад к остаткам
          </Button>
        </div>

        <div className="space-y-2">
          {assemblyItems.map((item) => {
            const canMake = assemblyCapacity[item.id] ?? 0;
            const deficit = shortages[item.id];
            const stock = balances[item.id] ?? 0;

            return (
              <div
                key={item.id}
                className="bg-card rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${typeColors[item.type]}`}>
                      {itemTypeLabels[item.type]}
                    </Badge>
                    <span className="text-foreground text-xs font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      На складе: <span className="text-foreground font-mono">{stock}</span>
                    </span>
                    <span className={`text-xs font-mono ${canMake > 0 ? "text-emerald-400" : "text-destructive"}`}>
                      Можно собрать: {canMake}
                    </span>
                  </div>
                </div>

                {deficit && (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-destructive text-[10px] font-medium">Не хватает для 1 шт:</p>
                    {deficit.map((d) => (
                      <p key={d.name} className="text-muted-foreground text-[10px] pl-2">
                        {d.name}: нужно {formatNumber(d.needed)}, есть {formatNumber(d.available)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground text-xs h-8 max-w-xs"
        />

        <div className="flex gap-1">
          {(["all", "material", "blank", "part", "subassembly", "product"] as const).map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-2 ${filterType === t ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              onClick={() => setFilterType(t)}
            >
              {t === "all" ? "Все" : itemTypeLabels[t]}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={`text-xs h-7 px-2 ${showZeroOnly ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300" : "text-muted-foreground"}`}
          onClick={() => setShowZeroOnly(!showZeroOnly)}
        >
          Нулевые
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 px-3 border-border text-muted-foreground ml-auto"
          onClick={() => setShowAssembly(true)}
        >
          Возможность сборки
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-medium h-8">Наименование</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium h-8 w-24">Тип</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium h-8 w-28 text-right">Остаток</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const bal = balances[item.id] ?? 0;
              return (
                <TableRow key={item.id} className="border-border/50 hover:bg-accent/50">
                  <TableCell className="py-1.5">
                    <span className="text-foreground text-xs">{item.name}</span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[item.type]}`}>
                      {itemTypeLabels[item.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5 text-right">
                    <span className={`text-xs font-mono ${bal === 0 ? "text-destructive" : "text-foreground"}`}>
                      {formatNumber(bal)} {unitLabels[item.unit]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
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
