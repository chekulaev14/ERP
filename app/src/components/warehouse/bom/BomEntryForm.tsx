"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { NomenclatureItem } from "@/lib/types";
import { itemTypeLabels, typeColors } from "@/lib/constants";

interface Props {
  allItems: NomenclatureItem[];
  currentItemId: string;
  existingChildIds: string[];
  onAdd: (childId: string, quantity: number) => void;
  onCancel: () => void;
  saving: boolean;
}

export function BomEntryForm({ allItems, currentItemId, existingChildIds, onAdd, onCancel, saving }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [childQty, setChildQty] = useState("1");

  const availableItems = allItems.filter((i) =>
    i.id !== currentItemId && !existingChildIds.includes(i.id)
  );

  const selectedItem = selectedId ? availableItems.find((i) => i.id === selectedId) : null;
  const qty = Number(childQty);
  const canAdd = !!selectedId && qty > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(selectedId!, qty);
  };

  const handleReset = () => {
    setSelectedId(null);
    setChildQty("1");
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 mb-2 space-y-2">
      {selectedItem ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs px-1.5 py-0 shrink-0 ${typeColors[selectedItem.type]}`}>
            {itemTypeLabels[selectedItem.type]}
          </Badge>
          <span className="text-sm truncate flex-1">{selectedItem.name}</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleReset} disabled={saving}>
            Сбросить
          </Button>
        </div>
      ) : (
        <SearchableSelect
          items={availableItems}
          value={null}
          onChange={(key) => { if (key) setSelectedId(key); }}
          getKey={(i) => i.id}
          getLabel={(i) => i.name}
          placeholder="Поиск позиции..."
          disabled={saving}
          maxItems={10}
          filterFn={(i, q) =>
            i.name.toLowerCase().includes(q.toLowerCase()) ||
            i.id.toLowerCase().includes(q.toLowerCase())
          }
          renderItem={(i) => (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs px-1.5 py-0 shrink-0 ${typeColors[i.type]}`}>
                {itemTypeLabels[i.type]}
              </Badge>
              <span className="truncate">{i.name}</span>
            </div>
          )}
        />
      )}
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-xs">Кол-во:</label>
        <Input
          type="number"
          step="0.001"
          min="0.001"
          value={childQty}
          onChange={(e) => setChildQty(e.target.value)}
          className="h-8 text-sm w-24"
        />
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!canAdd || saving}
          onClick={handleAdd}
        >
          {saving ? "..." : "Добавить"}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
