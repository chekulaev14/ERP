"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useWarehouse } from "../WarehouseContext";
import { ChainBlock } from "./ChainBlock";
import { ChainArrow } from "./ChainArrow";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { unitLabels } from "@/lib/constants";
import type { BomChildEntry } from "@/lib/types";

interface ChainStep {
  itemId: string | null;
  quantity: number;
}

/**
 * Build linear chain from BOM tree (product → ... → leaf), then reverse.
 * Stops if branching (>1 child) is found — returns what it can.
 */
function buildChainFromBom(
  productId: string,
  bomMap: Record<string, BomChildEntry[]>,
): ChainStep[] {
  const chain: ChainStep[] = [];
  let currentId = productId;

  while (true) {
    const children = bomMap[currentId];
    if (!children || children.length === 0) break;

    if (children.length > 1) {
      // Branching — show direct children as separate steps to product
      for (const c of children) {
        chain.push({ itemId: c.item.id, quantity: c.quantity });
      }
      break;
    }

    // Single child — linear chain
    chain.push({ itemId: children[0].item.id, quantity: children[0].quantity });
    currentId = children[0].item.id;
  }

  // Reverse: was [child_of_product, ..., leaf] → need [leaf, ..., child_of_product]
  chain.reverse();
  return chain;
}

export function ChainConstructor() {
  const { items, bomChildren, refresh } = useWarehouse();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [chain, setChain] = useState<ChainStep[]>([{ itemId: null, quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  const products = useMemo(() => items.filter((i) => i.type === "product"), [items]);
  const selectedProduct = selectedProductId ? items.find((i) => i.id === selectedProductId) ?? null : null;

  // Load existing BOM chain when product changes
  const loadExistingChain = useCallback((productId: string | null) => {
    if (!productId) {
      setChain([{ itemId: null, quantity: 1 }]);
      return;
    }
    const existing = buildChainFromBom(productId, bomChildren);
    if (existing.length > 0) {
      setChain(existing);
    } else {
      setChain([{ itemId: null, quantity: 1 }]);
    }
  }, [bomChildren]);

  const handleProductChange = (id: string | null) => {
    setSelectedProductId(id);
    loadExistingChain(id);
  };

  // Reload chain when bomChildren update (after save)
  useEffect(() => {
    if (selectedProductId) {
      loadExistingChain(selectedProductId);
    }
  }, [bomChildren, selectedProductId, loadExistingChain]);

  // Exclude already used items + product from selection
  const usedIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of chain) {
      if (s.itemId) set.add(s.itemId);
    }
    if (selectedProductId) set.add(selectedProductId);
    return set;
  }, [chain, selectedProductId]);

  const availableItems = useMemo(
    () => items.filter((i) => !usedIds.has(i.id)),
    [items, usedIds],
  );

  const getItem = (id: string | null) => (id ? items.find((i) => i.id === id) ?? null : null);

  const updateStep = (index: number, patch: Partial<ChainStep>) => {
    setChain((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStep = () => {
    setChain((prev) => [...prev, { itemId: null, quantity: 1 }]);
  };

  const removeStep = (index: number) => {
    setChain((prev) => prev.filter((_, i) => i !== index));
  };

  const canSave = selectedProductId && chain.length > 0 && chain.every((s) => s.itemId && s.quantity > 0);

  const handleSave = async () => {
    if (!canSave || !selectedProductId) return;

    // Chain: [A] →(qty0) [B] →(qty1) ... →(qtyN) [Product]
    // Links: parent=B child=A qty=qty0, ... parent=Product child=last qty=qtyN
    const ids = [...chain.map((s) => s.itemId!), selectedProductId];
    const links: { parentId: string; childId: string; quantity: number }[] = [];

    for (let i = 0; i < chain.length; i++) {
      links.push({
        parentId: ids[i + 1],
        childId: ids[i],
        quantity: chain[i].quantity,
      });
    }

    setSaving(true);
    try {
      for (const link of links) {
        await api.post("/api/bom", link);
      }
      toast.success(`Сохранено: ${links.length} связей`);
      refresh();
    } catch {
      // api-client shows toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">Изделие:</span>
        <SearchableSelect
          items={products}
          value={selectedProductId}
          onChange={handleProductChange}
          getKey={(i) => i.id}
          getLabel={(i) => i.name}
          placeholder="Выберите изделие..."
          className="min-w-[220px]"
          renderItem={(i) => (
            <div>
              <span className="text-foreground">{i.name}</span>
              <span className="text-muted-foreground text-xs ml-2">{i.code}</span>
            </div>
          )}
        />
        <div className="flex-1" />
        <Button size="sm" disabled={!canSave || saving} onClick={handleSave}>
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {/* Chain */}
      {selectedProduct ? (
        <>
          <div className="pb-2">
            <div className="flex items-center flex-wrap gap-y-3">
              {chain.map((step, i) => {
                const item = getItem(step.itemId);
                return (
                  <div key={i} className="flex items-center">
                    <ChainBlock
                      item={item}
                      items={availableItems}
                      onSelect={(id) => updateStep(i, { itemId: id })}
                      onRemove={chain.length > 1 ? () => removeStep(i) : undefined}
                    />
                    <ChainArrow
                      quantity={step.quantity}
                      unit={item ? unitLabels[item.unit] : undefined}
                      onChange={(qty) => updateStep(i, { quantity: qty })}
                    />
                  </div>
                );
              })}

              {/* Product block (fixed) */}
              <ChainBlock
                item={selectedProduct}
                items={[]}
                fixed
                onSelect={() => {}}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addStep}
              className="w-9 h-9 rounded-lg border-[1.5px] border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 text-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
            >
              +
            </button>
            <span className="text-xs text-muted-foreground">Добавить шаг в цепочку</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Выберите изделие, чтобы начать строить цепочку</p>
      )}
    </div>
  );
}
