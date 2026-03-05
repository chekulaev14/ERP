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
  const [selectedItem, setSelectedItem] = useState<NomenclatureItem | null>(null);

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
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white mb-3 text-xs px-2 h-7"
          onClick={() => setSelectedItem(null)}
        >
          ← Назад к списку
        </Button>
        <BomView item={selectedItem} balances={balances} onNavigate={setSelectedItem} items={items} />
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
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-xs h-8 max-w-xs"
        />

        <div className="flex gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs h-7 px-2 ${filterType === "all" ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
            onClick={() => setFilterType("all")}
          >
            Все
          </Button>
          {typeOrder.map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-2 ${filterType === t ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
              onClick={() => setFilterType(t)}
            >
              {itemTypeLabels[t]}
            </Button>
          ))}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 h-7"
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

      <p className="text-zinc-500 text-xs">{filtered.length} позиций</p>

      <div className="rounded-lg border border-zinc-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700 hover:bg-transparent">
              <TableHead className="text-zinc-400 text-xs font-medium h-8">Наименование</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-8 w-24">Тип</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-8 w-20 text-right">Остаток</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-8 w-12 text-right">Ед.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow
                key={item.id}
                className="border-zinc-700/50 cursor-pointer hover:bg-zinc-800/80"
                onClick={() => setSelectedItem(item)}
              >
                <TableCell className="py-1.5">
                  <div>
                    <p className="text-white text-xs font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-zinc-500 text-[10px] mt-0.5 line-clamp-1 max-w-md">
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
                  <span className="text-white text-xs font-mono">
                    {formatNumber(balances[item.id] ?? 0)}
                  </span>
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <span className="text-zinc-500 text-xs">{unitLabels[item.unit]}</span>
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
