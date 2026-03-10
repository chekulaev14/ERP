"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useWarehouse } from "../WarehouseContext";
import { Button } from "@/components/ui/button";
import { itemTypeLabels } from "@/lib/constants";
import type { NomenclatureItem } from "@/lib/types";
import { useConstructorBom } from "./use-constructor-bom";
import { useConstructorColumns } from "./use-constructor-columns";
import { ItemCard } from "./ItemCard";
import { AddSlot } from "./AddSlot";
import { LinkOverlay } from "./LinkOverlay";
import { ZoomControls } from "./ZoomControls";

/* ── Карточка изделия в списке ── */

function ProductListCard({
  product,
  childrenCount,
  onClick,
}: {
  product: NomenclatureItem;
  childrenCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border-[1.5px] border-emerald-300 rounded-lg px-4 py-3 bg-white hover:bg-emerald-50/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
          {itemTypeLabels.product}
        </span>
        <span className="text-sm font-medium">{product.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">{product.code}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">
        {childrenCount > 0 ? `${childrenCount} компонент.` : "BOM не настроен"}
      </div>
    </button>
  );
}

/* ── Главный компонент (orchestrator) ── */

export function ChainConstructor() {
  const { items, bomChildren } = useWarehouse();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [addParent, setAddParent] = useState<Record<number, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { localBom, columnsBom, addLink, removeLink, updateQuantity, removeItem, isDirty, save, saving } =
    useConstructorBom(selectedProductId);

  // Колонки строятся по columnsBom (стабильный — не меняется при removeLink)
  const columns = useConstructorColumns(columnsBom, selectedProductId);

  const products = useMemo(() => items.filter((i) => i.type === "product"), [items]);
  const selectedProduct = selectedProductId
    ? items.find((i) => i.id === selectedProductId) ?? null
    : null;

  const itemsById = useMemo(() => {
    const map = new Map<string, NomenclatureItem>();
    for (const i of items) map.set(i.id, i);
    return map;
  }, [items]);

  // Items уже использованные в BOM
  const usedIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedProductId) set.add(selectedProductId);
    for (const col of columns) for (const ci of col) set.add(ci.itemId);
    return set;
  }, [selectedProductId, columns]);

  const availableItems = useMemo(
    () => items.filter((i) => (i.type === "blank" || i.type === "material") && !usedIds.has(i.id)),
    [items, usedIds],
  );

  // Колонка каждого item
  const itemColMap = useMemo(() => {
    const map = new Map<string, number>();
    columns.forEach((col, colIdx) => {
      for (const ci of col) map.set(ci.itemId, colIdx);
    });
    if (selectedProductId) map.set(selectedProductId, columns.length);
    return map;
  }, [columns, selectedProductId]);

  // Links для LinkOverlay — из localBom (реактивный, обновляется при removeLink)
  const allLinks = useMemo(() => {
    const result: { fromId: string; toId: string }[] = [];
    for (const [parentId, children] of Object.entries(localBom)) {
      for (const child of children) {
        result.push({ fromId: `card-${child.childId}`, toId: `card-${parentId}` });
      }
    }
    return result;
  }, [localBom]);

  // Сброс addParent при изменении колонок
  useEffect(() => setAddParent({}), [columns.length]);

  // --- Linking ---

  const clearSelection = useCallback(() => setSelectedCard(null), []);

  const handleCardClick = useCallback(
    (itemId: string) => {
      if (itemId === selectedProductId && !selectedCard) return;

      if (!selectedCard) {
        if (itemId !== selectedProductId) setSelectedCard(itemId);
        return;
      }

      if (itemId === selectedCard) {
        clearSelection();
        return;
      }

      const sourceCol = itemColMap.get(selectedCard) ?? -1;
      const targetCol = itemColMap.get(itemId) ?? -1;

      if (targetCol === sourceCol + 1) {
        addLink(itemId, selectedCard);
        clearSelection();
        return;
      }

      if (itemId !== selectedProductId) {
        setSelectedCard(itemId);
      } else {
        clearSelection();
      }
    },
    [selectedCard, selectedProductId, itemColMap, addLink, clearSelection],
  );

  // Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCard) clearSelection();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedCard, clearSelection]);

  // Клик вне карточки
  const handleAreaClick = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedCard) return;
      const t = e.target as HTMLElement;
      if (t.closest("[data-card-id]") || t.closest("input") || t.closest("button")) return;
      clearSelection();
    },
    [selectedCard, clearSelection],
  );

  // Ctrl+scroll zoom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.max(0.4, Math.min(1.5, +(z + delta).toFixed(2))));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const handleRemoveLink = useCallback(
    (fromId: string, toId: string) => {
      const childId = fromId.replace("card-", "");
      const parentId = toId.replace("card-", "");
      removeLink(parentId, childId);
    },
    [removeLink],
  );

  // AddSlot: parent = items из правой колонки или product
  const getParentForCol = useCallback(
    (colIdx: number): string | null => {
      if (colIdx === columns.length - 1) return selectedProductId;
      const rightCol = columns[colIdx + 1];
      if (!rightCol || rightCol.length === 0) return selectedProductId;
      const idx = addParent[colIdx] ?? 0;
      return rightCol[idx]?.itemId ?? rightCol[0]?.itemId ?? null;
    },
    [columns, selectedProductId, addParent],
  );

  // Layout
  const totalCols = Math.max(columns.length, 1) + 1;
  const minWidth = totalCols * 230 + (totalCols - 1) * 64;
  const selectedCol = selectedCard ? (itemColMap.get(selectedCard) ?? -1) : -1;
  const blankColumnsCount = columns.length > 0 ? columns.length - 1 : 0;

  /* ── Список изделий ── */

  if (!selectedProduct) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold text-foreground pb-3 border-b border-border">
          Конструктор изделий
        </div>
        <div className="grid grid-cols-1 gap-2">
          {products.map((product) => (
            <ProductListCard
              key={product.id}
              product={product}
              childrenCount={(bomChildren[product.id] || []).length}
              onClick={() => setSelectedProductId(product.id)}
            />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Нет изделий. Создайте изделие в номенклатуре.
          </p>
        )}
      </div>
    );
  }

  /* ── Редактор BOM ── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={() => {
            if (isDirty && !window.confirm("Есть несохранённые изменения. Выйти без сохранения?")) return;
            setSelectedProductId(null);
            clearSelection();
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Назад
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            {itemTypeLabels.product}
          </span>
          <span className="text-sm font-semibold">{selectedProduct.name}</span>
          <span className="text-xs text-muted-foreground">{selectedProduct.code}</span>
        </div>
        <div className="flex-1" />
        <Button size="sm" disabled={!isDirty || saving} onClick={save}>
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {/* Hint bar */}
      <div
        className={`text-[12px] border rounded-lg px-3 py-2 flex items-center gap-2 min-h-[36px] transition-all ${
          selectedCard
            ? "bg-blue-50 border-blue-300 text-blue-800"
            : "bg-white border-gray-200 text-gray-500"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            selectedCard ? "bg-blue-500" : "bg-gray-400"
          }`}
        />
        {selectedCard ? (
          <>
            <span>
              Выбрано: {itemsById.get(selectedCard)?.name}. Кликните на карточку справа, чтобы
              связать.
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto text-[11px] text-gray-500 border border-gray-300 rounded px-2 py-0.5 bg-white hover:bg-gray-50"
            >
              Отмена
            </button>
          </>
        ) : (
          <span>
            Кликните на карточку, чтобы начать связь. Наведите на линию, чтобы удалить.
          </span>
        )}
      </div>

      {/* Zoom + columns */}
      <div ref={scrollRef} className="overflow-x-auto relative">
        <div className="sticky top-0 left-0 z-20 mb-3">
          <ZoomControls zoom={zoom} onZoomChange={setZoom} />
        </div>

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
          }}
        >
          <div
            ref={containerRef}
            className="relative flex gap-x-16 min-h-[200px] px-2 pb-5"
            style={{ minWidth: `${minWidth}px` }}
            onClick={handleAreaClick}
          >
            <LinkOverlay
              links={allLinks}
              containerRef={containerRef}
              onRemoveLink={handleRemoveLink}
              zoom={zoom}
            />

            {/* Колонки */}
            {columns.map((col, colIdx) => {
              const label =
                colIdx === 0
                  ? "Сырьё"
                  : blankColumnsCount === 1
                    ? "Заготовки"
                    : `Заготовка ${colIdx}`;

              // Parent candidates для AddSlot
              const isLastCol = colIdx === columns.length - 1;
              const rightCol = isLastCol ? null : columns[colIdx + 1];
              const parentCandidates = rightCol || [];
              const selParentIdx = addParent[colIdx] ?? 0;

              return (
                <div key={colIdx} className="min-w-[230px] flex-shrink-0 relative z-[1]">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {label}
                  </div>

                  {col.map((entry) => {
                    const item = itemsById.get(entry.itemId);
                    if (!item) return null;

                    return (
                      <ItemCard
                        key={entry.itemId}
                        item={item}
                        quantity={entry.quantity}
                        onQuantityChange={(q) =>
                          updateQuantity(entry.parentItemId, entry.itemId, q)
                        }
                        onRemove={() => removeItem(entry.itemId)}
                        isSelected={selectedCard === entry.itemId}
                        isLinkTarget={selectedCard !== null && colIdx === selectedCol + 1}
                        onClick={() => handleCardClick(entry.itemId)}
                        cardId={`card-${entry.itemId}`}
                      />
                    );
                  })}

                  {/* AddSlot с dropdown если parents > 1 */}
                  {!isLastCol && parentCandidates.length > 1 && (
                    <select
                      value={selParentIdx}
                      onChange={(e) =>
                        setAddParent((p) => ({ ...p, [colIdx]: Number(e.target.value) }))
                      }
                      className="text-[11px] border border-input rounded px-1.5 py-1 bg-background text-foreground mb-1 w-full"
                    >
                      {parentCandidates.map((ci, i) => (
                        <option key={ci.itemId} value={i}>
                          {itemsById.get(ci.itemId)?.name || `Позиция ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <AddSlot
                    items={availableItems}
                    onSelect={(id) => {
                      const parentId = getParentForCol(colIdx);
                      if (parentId) addLink(parentId, id);
                    }}
                    placeholder="+ Добавить..."
                  />
                </div>
              );
            })}

            {/* Пустой слот если нет колонок */}
            {columns.length === 0 && (
              <div className="min-w-[230px] flex-shrink-0 relative z-[1]">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Компоненты
                </div>
                <AddSlot
                  items={availableItems}
                  onSelect={(id) => selectedProductId && addLink(selectedProductId, id)}
                  placeholder="+ Добавить компонент..."
                />
              </div>
            )}

            {/* Изделие */}
            <div className="min-w-[230px] flex-shrink-0 relative z-[1]">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Изделие
              </div>
              <ItemCard
                item={selectedProduct}
                cardId={`card-${selectedProductId}`}
                isLinkTarget={
                  selectedCard !== null && selectedCol === columns.length - 1
                }
                onClick={() => handleCardClick(selectedProductId!)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
