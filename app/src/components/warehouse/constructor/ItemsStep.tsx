"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ItemType } from "@/lib/types";
import { itemTypeLabels, typeColors } from "@/lib/constants";
import type { ConstructorItem, DbItem } from "./wizard-reducer";
import { ItemCard } from "./ItemCard";

interface ItemsStepProps {
  step: number;
  stepInfo: { type: ItemType; label: string; componentsFrom: string };
  items: ConstructorItem[];
  onAdd: () => void;
  onUpdate: (tempId: string, field: keyof ConstructorItem, value: string | boolean) => void;
  onSelectExisting: (tempId: string, dbItem: DbItem) => void;
  onClearExisting: (tempId: string) => void;
  onRemove: (tempId: string) => void;
  dbItems: DbItem[];
  dbLoading: boolean;
  loadDbItems: () => void;
  getAvailableComponents: (excludeTempId?: string) => (ConstructorItem & { type: ItemType })[];
  getComponentsOf: (parentTempId: string) => (ConstructorItem & { type: ItemType })[];
  onAttach: (componentTempId: string, parentTempId: string) => void;
  onDetach: (componentTempId: string) => void;
  onUpdateQuantity: (componentTempId: string, quantity: string) => void;
}

export function ItemsStep({
  step,
  stepInfo,
  items,
  onAdd,
  onUpdate,
  onSelectExisting,
  onClearExisting,
  onRemove,
  dbItems,
  dbLoading,
  loadDbItems,
  getAvailableComponents,
  getComponentsOf,
  onAttach,
  onDetach,
  onUpdateQuantity,
}: ItemsStepProps) {
  const hasComponents = step > 0;
  const isMaterial = step === 0;

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
            {isMaterial
              ? "Добавьте сырье и материалы с закупочными ценами"
              : `Добавьте позиции и выберите компоненты из ${stepInfo.componentsFrom}`}
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
          isMaterial={isMaterial}
          onUpdate={onUpdate}
          onSelectExisting={onSelectExisting}
          onClearExisting={onClearExisting}
          onRemove={onRemove}
          hasComponents={hasComponents}
          dbItems={dbItems}
          dbLoading={dbLoading}
          loadDbItems={loadDbItems}
          getAvailableComponents={getAvailableComponents}
          getComponentsOf={getComponentsOf}
          onAttach={onAttach}
          onDetach={onDetach}
          onUpdateQuantity={onUpdateQuantity}
        />
      ))}
    </div>
  );
}
