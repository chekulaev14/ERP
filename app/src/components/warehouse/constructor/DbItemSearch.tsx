"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ItemType } from "@/lib/types";
import { itemTypeLabels, typeColors } from "@/lib/constants";
import type { DbItem } from "./wizard-reducer";

const typeOrder: ItemType[] = ["material", "blank", "product"];

interface DbItemSearchProps {
  dbItems: DbItem[];
  dbLoading: boolean;
  onSelect: (dbItem: DbItem) => void;
}

export function DbItemSearch({ dbItems, dbLoading, onSelect }: DbItemSearchProps) {
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const isSearching = query.trim().length > 0;

  const filtered = isSearching
    ? dbItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : dbItems;

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

  const toggleCat = (catId: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-2 space-y-1.5">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию..."
        className="h-8 text-sm"
      />
      {dbLoading && <p className="text-xs text-muted-foreground">Загрузка...</p>}

      {!dbLoading && isSearching && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.map((dbItem) => (
            <DbItemButton key={dbItem.id} dbItem={dbItem} onClick={() => onSelect(dbItem)} />
          ))}
        </div>
      )}

      {!dbLoading && !isSearching && grouped && grouped.length > 0 && (
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
                      <DbItemButton key={dbItem.id} dbItem={dbItem} onClick={() => onSelect(dbItem)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!dbLoading && isSearching && filtered.length === 0 && (
        <p className="text-xs text-muted-foreground">Ничего не найдено</p>
      )}
      {!dbLoading && !isSearching && (!grouped || grouped.length === 0) && (
        <p className="text-xs text-muted-foreground">База пуста</p>
      )}
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
