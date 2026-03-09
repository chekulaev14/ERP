"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ItemType, Unit } from "@/lib/types";
import { itemTypeLabels, unitLabels } from "@/lib/constants";

const typeOrder: ItemType[] = ["material", "blank", "product"];

export interface SessionItem {
  id: string;
  name: string;
  typeId: string;
  unitId: string;
  quantity: string;
  pricePerUnit: string;
  weight: string;
}

interface Props {
  items: SessionItem[];
  onUpdate: (id: string, field: keyof SessionItem, value: string) => void;
  onSave: (item: SessionItem) => void;
  onDelete: (item: SessionItem) => void;
  onQuantityChange?: (item: SessionItem, newQuantity: string) => void;
}

export function SessionItemsList({ items, onUpdate, onSave, onDelete, onQuantityChange }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="inline-flex items-center justify-center bg-foreground text-background w-5 h-5 rounded-full text-[11px] font-semibold mr-2">
          {items.length}
        </span>
        <span className="text-muted-foreground text-sm">Добавлено в этой сессии</span>
      </div>

      {items.map((item) => (
        <div key={item.id} className="px-4 py-2.5 border-b border-border/50 last:border-b-0">
          <div className="flex gap-2.5 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-foreground/70 text-xs block mb-1">Название</label>
              <Input
                value={item.name}
                onChange={(e) => onUpdate(item.id, "name", e.target.value)}
                onBlur={() => onSave(item)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-foreground/70 text-xs block mb-1">Тип</label>
              <Select
                value={item.typeId}
                onValueChange={(v) => {
                  onUpdate(item.id, "typeId", v);
                  onSave({ ...item, typeId: v });
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOrder.map((t) => (
                    <SelectItem key={t} value={t}>{itemTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-foreground/70 text-xs block mb-1">Ед.</label>
              <Select
                value={item.unitId}
                onValueChange={(v) => {
                  onUpdate(item.id, "unitId", v);
                  onSave({ ...item, unitId: v });
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(unitLabels) as Unit[]).map((u) => (
                    <SelectItem key={u} value={u}>{unitLabels[u]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-foreground/70 text-xs block mb-1">Кол-во</label>
              <Input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
                onBlur={() => onQuantityChange?.(item, item.quantity)}
                className="h-8 text-sm w-20"
              />
            </div>
            <div>
              <label className="text-foreground/70 text-xs block mb-1">Цена, ₽</label>
              <Input
                type="number"
                value={item.pricePerUnit}
                onChange={(e) => onUpdate(item.id, "pricePerUnit", e.target.value)}
                onBlur={() => onSave(item)}
                className="h-8 text-sm w-24"
                placeholder="—"
              />
            </div>
            <button
              className="mb-0.5 p-1.5 rounded text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Удалить"
              onClick={() => onDelete(item)}
            >
              &#10005;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
