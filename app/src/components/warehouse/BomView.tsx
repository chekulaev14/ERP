"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  type NomenclatureItem,
  type ItemType,
  itemTypeLabels,
  unitLabels,
  getChildren,
} from "@/data/nomenclature";

interface BomChild {
  item: NomenclatureItem;
  quantity: number;
}

interface Props {
  item: NomenclatureItem;
  balances: Record<string, number>;
}

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-900/50 text-amber-300 border-amber-700",
  blank: "bg-orange-900/50 text-orange-300 border-orange-700",
  part: "bg-blue-900/50 text-blue-300 border-blue-700",
  subassembly: "bg-purple-900/50 text-purple-300 border-purple-700",
  product: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
};

export function BomView({ item, balances }: Props) {
  const [children, setChildren] = useState<BomChild[]>([]);
  const [parents, setParents] = useState<BomChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/nomenclature?itemId=${item.id}`)
      .then((r) => r.json())
      .then((data) => {
        setChildren(data.children || []);
        setParents(data.parents || []);
      })
      .finally(() => setLoading(false));
  }, [item.id]);

  const balance = balances[item.id] ?? 0;

  const canAssemble = !loading && children.length > 0
    ? Math.min(...children.map((c) => {
        const available = balances[c.item.id] ?? 0;
        return c.quantity > 0 ? Math.floor(available / c.quantity) : 0;
      }))
    : null;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Карточка позиции */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-start gap-3">
          {item.images && item.images.length > 0 && (
            <img
              src={item.images[0]}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg border border-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-foreground text-sm font-semibold">{item.name}</h2>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[item.type]}`}>
                {itemTypeLabels[item.type]}
              </Badge>
            </div>
            <p className="text-muted-foreground/70 text-[10px] font-mono mb-1">{item.id}</p>
            {item.description && (
              <p className="text-muted-foreground text-xs">{item.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-muted-foreground/70 text-[10px]">На складе:</span>
                <span className="text-foreground text-sm font-semibold ml-1">
                  {formatNumber(balance)} {unitLabels[item.unit]}
                </span>
              </div>
              {canAssemble !== null && (
                <div>
                  <span className="text-muted-foreground/70 text-[10px]">Можно собрать:</span>
                  <span className={`text-sm font-semibold ml-1 ${canAssemble > 0 ? "text-emerald-500" : "text-destructive"}`}>
                    {canAssemble} шт
                  </span>
                </div>
              )}
              {item.pricePerUnit && (
                <div>
                  <span className="text-muted-foreground/70 text-[10px]">Расценка:</span>
                  <span className="text-emerald-400 text-sm ml-1">{item.pricePerUnit} ₽</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground/70 text-xs">Загрузка спецификации...</p>
      ) : (
        <>
          {/* Из чего состоит */}
          {children.length > 0 && (
            <div>
              <h3 className="text-muted-foreground text-xs font-medium mb-2">
                Состав (из чего делается) — {children.length} поз.
              </h3>
              <div className="space-y-1">
                {children.map((child) => {
                  const childBalance = balances[child.item.id] ?? 0;
                  const childChildren = getChildren(child.item.id);
                  const childCanAssemble = childChildren.length > 0
                    ? Math.min(...childChildren.map((cc) => {
                        const av = balances[cc.item.id] ?? 0;
                        return cc.quantity > 0 ? Math.floor(av / cc.quantity) : 0;
                      }))
                    : null;
                  return (
                    <div
                      key={child.item.id}
                      className="bg-card/60 rounded border border-border/50 px-3 py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${typeColors[child.item.type]}`}>
                          {itemTypeLabels[child.item.type]}
                        </Badge>
                        <span className="text-foreground text-xs truncate">{child.item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {childCanAssemble !== null && (
                          <span className={`text-[10px] font-mono ${childCanAssemble > 0 ? "text-emerald-500" : "text-destructive"}`}>
                            собрать: {childCanAssemble}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs font-mono">
                          ×{formatNumber(child.quantity)} {unitLabels[child.item.unit]}
                        </span>
                        <span className={`text-xs font-mono ${childBalance > 0 ? "text-muted-foreground" : "text-destructive"}`}>
                          (ост: {formatNumber(childBalance)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Куда входит */}
          {parents.length > 0 && (
            <div>
              <h3 className="text-muted-foreground text-xs font-medium mb-2">
                Входит в состав — {parents.length} поз.
              </h3>
              <div className="space-y-1">
                {parents.map((parent) => (
                  <div
                    key={parent.item.id}
                    className="bg-card/60 rounded border border-border/50 px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${typeColors[parent.item.type]}`}>
                        {itemTypeLabels[parent.item.type]}
                      </Badge>
                      <span className="text-foreground text-xs truncate">{parent.item.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-mono shrink-0 ml-3">
                      нужно ×{formatNumber(parent.quantity)} {unitLabels[item.unit]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && parents.length === 0 && (
            <p className="text-muted-foreground/70 text-xs">Нет связей в спецификации</p>
          )}
        </>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("ru-RU");
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 3 });
}
