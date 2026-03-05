"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

const typeOrder: ItemType[] = ["material", "blank", "part", "subassembly", "product"];

export function StockTab({ items, balances, onRefresh }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<ItemType>>(new Set());

  const toggleType = (type: ItemType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = items;

    if (showZeroOnly) {
      result = result.filter((i) => (balances[i.id] ?? 0) === 0);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, search, showZeroOnly, balances]);

  const grouped = useMemo(() => {
    const groups: Record<ItemType, NomenclatureItem[]> = {
      material: [],
      blank: [],
      part: [],
      subassembly: [],
      product: [],
    };
    for (const item of filtered) {
      groups[item.type].push(item);
    }
    for (const type of typeOrder) {
      groups[type].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }
    return groups;
  }, [filtered]);

  const effectiveExpanded = useMemo(() => {
    if (search) {
      const all = new Set<ItemType>();
      for (const type of typeOrder) {
        if (grouped[type].length > 0) all.add(type);
      }
      return all;
    }
    return expandedTypes;
  }, [search, expandedTypes, grouped]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground text-xs h-8 max-w-xs"
        />

        <Button
          variant="ghost"
          size="sm"
          className={`text-xs h-7 px-2 ${showZeroOnly ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300" : "text-muted-foreground"}`}
          onClick={() => setShowZeroOnly(!showZeroOnly)}
        >
          Нулевые
        </Button>
      </div>

      <div className="space-y-1">
        {typeOrder.map((type) => {
          const group = grouped[type];
          if (group.length === 0) return null;
          const isExpanded = effectiveExpanded.has(type);

          return (
            <div key={type} className="rounded-lg border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent/30 transition-colors"
                onClick={() => toggleType(type)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs w-4">
                    {isExpanded ? "−" : "+"}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[type]}`}>
                    {itemTypeLabels[type]}
                  </Badge>
                  <span className="text-muted-foreground/70 text-xs">{group.length} поз.</span>
                </div>
              </button>

              {isExpanded && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs font-medium h-7 pl-10">Наименование</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium h-7 w-28 text-right">Остаток</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.map((item) => {
                      const bal = balances[item.id] ?? 0;
                      return (
                        <TableRow
                          key={item.id}
                          className="border-border/50 hover:bg-accent/50 cursor-pointer"
                          onClick={() => router.push(`/warehouse/nomenclature/${item.id}`)}
                        >
                          <TableCell className="py-1.5 pl-10">
                            <span className="text-foreground text-xs">{item.name}</span>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("ru-RU");
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 3 });
}
