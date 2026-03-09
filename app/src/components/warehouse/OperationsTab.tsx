"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { createMovementSchema } from "@/lib/schemas/stock.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { NomenclatureItem } from "@/lib/types";
import { itemTypeLabels, unitLabels, typeColors, formatNumber } from "@/lib/constants";

interface Props {
  items: NomenclatureItem[];
  balances: Record<string, number>;
  onRefresh: () => void;
}

type OperationType = "supplier" | "shipment";

const opLabels: Record<OperationType, string> = {
  supplier: "Приход от поставщика",
  shipment: "Отгрузка",
};

export function OperationsTab({ items, balances, onRefresh }: Props) {
  const [opType, setOpType] = useState<OperationType>("supplier");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null;

  const availableItems = items.filter((i) => {
    if (opType === "supplier") return i.type === "material";
    if (opType === "shipment") return i.type === "product";
    return false;
  });

  const handleSubmit = async () => {
    if (!selectedItemId || !quantity || Number(quantity) <= 0) return;

    const action = opType === "supplier" ? "SUPPLIER_INCOME" : "SHIPMENT";

    const payload = {
      action,
      itemId: selectedItemId,
      quantity: Number(quantity),
      comment: comment || undefined,
    };
    const parsed = createMovementSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Ошибка валидации");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/api/stock", payload, { silent: true });

      const itemName = selectedItem?.name || selectedItemId;
      const unitLabel = unitLabels[selectedItem?.unit || "pcs"];
      const msg = opType === "supplier"
        ? `Оприходовано: ${itemName} — ${quantity} ${unitLabel}`
        : `Отгружено: ${itemName} — ${quantity} ${unitLabel}`;
      toast.success(msg);
      setSelectedItemId(null);
      setQuantity("");
      setComment("");
      onRefresh();
    } catch {
      // toast shown by api-client при отсутствии silent,
      // но мы используем silent — ошибка уже обработана в api-client
    } finally {
      setSubmitting(false);
    }
  };

  const currentBalance = selectedItemId ? (balances[selectedItemId] ?? 0) : 0;
  const notEnough = opType === "shipment" && Number(quantity) > 0 && Number(quantity) > currentBalance;

  return (
    <div className="space-y-4 max-w-lg w-full">
      <div className="flex flex-wrap gap-1">
        {(["supplier", "shipment"] as const).map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="sm"
            className={`text-sm h-9 px-3 ${opType === t ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            onClick={() => {
              setOpType(t);
              setSelectedItemId(null);
              setQuantity("");
            }}
          >
            {opLabels[t]}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <h3 className="text-foreground text-base font-medium">{opLabels[opType]}</h3>

        <div>
          <label className="text-muted-foreground text-sm block mb-1">Позиция</label>
          <SearchableSelect
            items={availableItems}
            value={selectedItemId}
            onChange={setSelectedItemId}
            getKey={(i) => i.id}
            getLabel={(i) => i.name}
            placeholder="Начните вводить название..."
            renderItem={(item) => (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 shrink-0 ${typeColors[item.type]}`}>
                  {itemTypeLabels[item.type]}
                </Badge>
                <span className="text-foreground text-sm truncate">{item.name}</span>
                <span className="text-muted-foreground text-xs ml-auto shrink-0">
                  {formatNumber(balances[item.id] ?? 0)} {unitLabels[item.unit]}
                </span>
              </div>
            )}
            renderSelected={(item) => (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${typeColors[item.type]}`}>
                  {itemTypeLabels[item.type]}
                </Badge>
                <span className="text-foreground text-sm">{item.name}</span>
              </div>
            )}
          />
        </div>

        <div>
          <label className="text-muted-foreground text-sm block mb-1">
            Количество{selectedItem ? ` (${unitLabels[selectedItem.unit]})` : ""}
          </label>
          <Input
            type="number"
            min="1"
            step={selectedItem?.unit === "kg" ? "0.1" : "1"}
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-background border-border text-foreground text-sm h-9 max-w-32"
          />
          {notEnough && (
            <p className="text-destructive text-xs mt-1">
              На складе: {formatNumber(currentBalance)} {unitLabels[selectedItem?.unit || "pcs"]}
            </p>
          )}
        </div>

        <div>
          <label className="text-muted-foreground text-sm block mb-1">Комментарий</label>
          <Textarea
            placeholder="Необязательно"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-background border-border text-foreground text-sm min-h-[60px] resize-none"
          />
        </div>

        <Button
          className="w-full h-10 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30"
          disabled={!selectedItemId || !quantity || Number(quantity) <= 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? "Обработка..."
            : opType === "supplier"
              ? "Оприходовать"
              : "Отгрузить"}
        </Button>
      </div>
    </div>
  );
}
