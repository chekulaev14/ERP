"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ItemType } from "@/lib/types";
import { itemTypeLabels, typeColors } from "@/lib/constants";
import type { ConstructorItem } from "./wizard-reducer";

interface ComponentsSectionProps {
  parentTempId: string;
  componentsFrom: string;
  getAvailableComponents: () => (ConstructorItem & { type: ItemType })[];
  getComponentsOf: (parentTempId: string) => (ConstructorItem & { type: ItemType })[];
  onAttach: (componentTempId: string, parentTempId: string) => void;
  onDetach: (componentTempId: string) => void;
  onUpdateQuantity: (componentTempId: string, quantity: string) => void;
}

export function ComponentsSection({
  parentTempId,
  componentsFrom,
  getAvailableComponents,
  getComponentsOf,
  onAttach,
  onDetach,
  onUpdateQuantity,
}: ComponentsSectionProps) {
  const [showPicker, setShowPicker] = useState(false);

  const attached = getComponentsOf(parentTempId);
  const available = getAvailableComponents().filter(
    (c) => c.parentTempId === "" || c.parentTempId === parentTempId
  );
  const unattached = available.filter((c) => c.parentTempId !== parentTempId);

  return (
    <div className="border-t border-border pt-2 mt-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-muted-foreground font-medium">
          Компоненты (из {componentsFrom})
        </label>
        {unattached.length > 0 && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showPicker ? "Скрыть" : "+ Добавить"}
          </button>
        )}
      </div>

      {attached.length === 0 && !showPicker && (
        <p className="text-xs text-muted-foreground/60">Нет компонентов</p>
      )}

      {attached.map((comp) => (
        <div key={comp.tempId} className="flex items-center gap-2 py-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[comp.type]}`}>
            {itemTypeLabels[comp.type].slice(0, 3)}
          </Badge>
          <span className="text-xs text-foreground truncate flex-1">{comp.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">расход:</span>
          <Input
            type="number"
            value={comp.quantity}
            onChange={(e) => onUpdateQuantity(comp.tempId, e.target.value)}
            className="h-7 text-xs w-16"
            min="0.01"
            step="0.01"
          />
          <button
            onClick={() => onDetach(comp.tempId)}
            className="text-xs text-red-500 hover:text-red-700 shrink-0"
          >
            x
          </button>
        </div>
      ))}

      {showPicker && unattached.length > 0 && (
        <div className="mt-1 rounded border border-border bg-muted/50 p-2 space-y-0.5 max-h-32 overflow-y-auto">
          {unattached.map((comp) => (
            <button
              key={comp.tempId}
              onClick={() => {
                onAttach(comp.tempId, parentTempId);
                if (unattached.length <= 1) setShowPicker(false);
              }}
              className="w-full text-left px-2 py-1 rounded text-xs hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[comp.type]}`}>
                {itemTypeLabels[comp.type].slice(0, 3)}
              </Badge>
              <span className="truncate">{comp.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
