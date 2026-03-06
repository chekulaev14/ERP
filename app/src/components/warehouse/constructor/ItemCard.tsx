"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemType } from "@/lib/types";
import { itemTypeLabels, unitLabels, typeColors } from "@/lib/constants";
import type { ConstructorItem, DbItem } from "./wizard-reducer";
import { DbItemSearch } from "./DbItemSearch";
import { ComponentsSection } from "./ComponentsSection";

interface ItemCardProps {
  item: ConstructorItem;
  idx: number;
  stepInfo: { type: ItemType; label: string; componentsFrom: string };
  isMaterial: boolean;
  onUpdate: (tempId: string, field: keyof ConstructorItem, value: string | boolean) => void;
  onSelectExisting: (tempId: string, dbItem: DbItem) => void;
  onClearExisting: (tempId: string) => void;
  onRemove: (tempId: string) => void;
  hasComponents: boolean;
  dbItems: DbItem[];
  dbLoading: boolean;
  loadDbItems: () => void;
  getAvailableComponents: (excludeTempId?: string) => (ConstructorItem & { type: ItemType })[];
  getComponentsOf: (parentTempId: string) => (ConstructorItem & { type: ItemType })[];
  onAttach: (componentTempId: string, parentTempId: string) => void;
  onDetach: (componentTempId: string) => void;
  onUpdateQuantity: (componentTempId: string, quantity: string) => void;
}

export function ItemCard({
  item,
  idx,
  stepInfo,
  isMaterial,
  onUpdate,
  onSelectExisting,
  onClearExisting,
  onRemove,
  hasComponents,
  dbItems,
  dbLoading,
  loadDbItems,
  getAvailableComponents,
  getComponentsOf,
  onAttach,
  onDetach,
  onUpdateQuantity,
}: ItemCardProps) {
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => {
    const next = !showSearch;
    setShowSearch(next);
    if (next) loadDbItems();
  };

  const selectItem = (dbItem: DbItem) => {
    onSelectExisting(item.tempId, dbItem);
    setShowSearch(false);
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
        <DbItemSearch dbItems={dbItems} dbLoading={dbLoading} onSelect={selectItem} />
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
            <label className="text-xs text-muted-foreground mb-1 block">Название</label>
            <Input
              value={item.name}
              onChange={(e) => onUpdate(item.tempId, "name", e.target.value)}
              placeholder="Название"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Единица</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">
              {isMaterial ? "Закупочная цена, руб" : "Расценка, руб"}
            </label>
            <Input
              value={item.pricePerUnit}
              onChange={(e) => onUpdate(item.tempId, "pricePerUnit", e.target.value)}
              className="h-8 text-sm"
              type="number"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
            <Input
              value={item.description}
              onChange={(e) => onUpdate(item.tempId, "description", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {isMaterial && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Расход на изделие</label>
              <Input
                value={item.quantity}
                onChange={(e) => onUpdate(item.tempId, "quantity", e.target.value)}
                className="h-8 text-sm"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {isMaterial && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Кол-во на складе</label>
              <Input
                value={item.stockQuantity}
                onChange={(e) => onUpdate(item.tempId, "stockQuantity", e.target.value)}
                className="h-8 text-sm"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}

      {hasComponents && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={item.isPaired}
            onChange={(e) => onUpdate(item.tempId, "isPaired", e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-xs text-foreground">Парная (лев/прав)</span>
        </label>
      )}

      {hasComponents && item.name.trim() && (
        <ComponentsSection
          parentTempId={item.tempId}
          componentsFrom={stepInfo.componentsFrom}
          getAvailableComponents={() => getAvailableComponents(item.tempId)}
          getComponentsOf={getComponentsOf}
          onAttach={onAttach}
          onDetach={onDetach}
          onUpdateQuantity={onUpdateQuantity}
        />
      )}
    </div>
  );
}
