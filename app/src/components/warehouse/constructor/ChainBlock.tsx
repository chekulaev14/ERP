"use client";

import { SearchableSelect } from "@/components/ui/searchable-select";
import type { NomenclatureItem } from "@/lib/types";
import { itemTypeLabels, unitLabels } from "@/lib/constants";

const blockColors: Record<string, string> = {
  material: "border-amber-300 bg-amber-50",
  blank: "border-blue-300 bg-blue-50",
  product: "border-emerald-300 bg-emerald-50",
};

const badgeColors: Record<string, string> = {
  material: "bg-amber-100 text-amber-800",
  blank: "bg-blue-100 text-blue-800",
  product: "bg-emerald-100 text-emerald-800",
};

interface ChainBlockProps {
  item: NomenclatureItem | null;
  items: NomenclatureItem[];
  fixed?: boolean;
  onSelect: (itemId: string | null) => void;
  onRemove?: () => void;
}

export function ChainBlock({ item, items, fixed, onSelect, onRemove }: ChainBlockProps) {
  if (!item) {
    return (
      <div className="border-[1.5px] border-dashed border-muted-foreground/30 bg-muted/30 rounded-lg p-2 min-w-[180px] shrink-0">
        <SearchableSelect
          items={items}
          value={null}
          onChange={(id) => onSelect(id)}
          getKey={(i) => i.id}
          getLabel={(i) => i.name}
          placeholder="Выберите позицию..."
          renderItem={(i) => (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeColors[i.type]}`}>
                {itemTypeLabels[i.type]}
              </span>
              <span>{i.name}</span>
            </div>
          )}
        />
      </div>
    );
  }

  const colors = fixed
    ? "border-emerald-600 bg-emerald-50 border-2"
    : `border-[1.5px] ${blockColors[item.type] || "border-border bg-card"}`;

  return (
    <div className={`relative rounded-lg ${colors} px-3 py-2 shrink-0`}>
      {!fixed && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-100 border border-red-300 text-red-600 text-[10px] leading-[14px] text-center hover:bg-red-200 transition-colors"
        >
          ×
        </button>
      )}
      <div className="text-sm leading-snug">
        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1.5 align-middle ${badgeColors[item.type]}`}>
          {itemTypeLabels[item.type]}
        </span>
        {item.name}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">
        {item.code} · {unitLabels[item.unit]}
      </div>
    </div>
  );
}
