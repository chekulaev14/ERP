"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupedAccordion } from "@/components/ui/grouped-accordion";
import { SideBadge } from "@/components/ui/side-badge";
import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { ItemForm, emptyItemFormValues, type ItemFormValues } from "@/components/warehouse/ItemForm";
import { SessionItemsList, type SessionItem } from "@/components/warehouse/SessionItemsList";
import type { NomenclatureItem, ItemType, PotentialItem } from "@/lib/types";
import { itemTypeLabels, unitLabels, typeColors, formatNumber } from "@/lib/constants";
import { api } from "@/lib/api-client";
import { createItemSchema } from "@/lib/schemas/nomenclature.schema";
import { toast } from "sonner";

interface Props {
  items: NomenclatureItem[];
  balances: Record<string, number>;
}

const typeOrder: ItemType[] = ["material", "blank", "product"];

export function NomenclatureTab({ items, balances }: Props) {
  const router = useRouter();
  const { editMode, refreshAll } = useWarehouse();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ItemFormValues>({ ...emptyItemFormValues });
  const [addSaving, setAddSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Пакетный ввод
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null);
  const [savedQuantities, setSavedQuantities] = useState<Record<string, number>>({});

  // Потенциал
  const [potentialMap, setPotentialMap] = useState<Record<string, number>>({});
  const [bottleneckMap, setBottleneckMap] = useState<Record<string, string>>({});
  const fetchPotential = useCallback(() => {
    api.get<{ items: PotentialItem[] }>("/api/stock/potential", { silent: true })
      .then((d) => {
        const map: Record<string, number> = {};
        const bnMap: Record<string, string> = {};
        for (const p of d.items) {
          map[p.itemId] = p.canProduce;
          if (p.canProduce === 0 && p.bottleneck) {
            bnMap[p.itemId] = p.bottleneck.name;
          }
        }
        setPotentialMap(map);
        setBottleneckMap(bnMap);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { fetchPotential(); }, [fetchPotential]);
  const balancesKey = useMemo(() => JSON.stringify(balances), [balances]);
  useEffect(() => { fetchPotential(); }, [balancesKey, fetchPotential]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q)
    );
  }, [items, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.type !== b.type) return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      return a.name.localeCompare(b.name, "ru");
    });
  }, [filtered]);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;

    const { quantity, ...nomData } = addForm;
    const parsed = createItemSchema.safeParse({
      ...nomData,
      pricePerUnit: nomData.pricePerUnit ? Number(nomData.pricePerUnit) : null,
      categoryId: nomData.categoryId || null,
      description: nomData.description || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Ошибка валидации");
      return;
    }

    setAddSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await api.post<any>("/api/nomenclature", parsed.data);
      const qty = Number(quantity);

      if (result.paired) {
        // Создана пара LEFT + RIGHT
        for (const item of result.items) {
          if (qty > 0) {
            await api.post("/api/stock", {
              action: "SUPPLIER_INCOME",
              itemId: item.id,
              quantity: qty,
              comment: "Начальный остаток",
            });
          }
          const savedQty = qty > 0 ? qty : 0;
          setSavedQuantities((prev) => ({ ...prev, [item.id]: savedQty }));
          const sideLabel = item.side === "LEFT" ? " (Л)" : " (П)";
          setSessionItems((prev) => [
            ...prev,
            {
              id: item.id,
              name: addForm.name.trim() + sideLabel,
              typeId: addForm.typeId,
              unitId: addForm.unitId,
              quantity: quantity || "0",
              pricePerUnit: addForm.pricePerUnit,
            },
          ]);
        }
        toast.success(`«${addForm.name.trim()}» — создана пара Л/П`);
      } else {
        // Обычное создание
        if (qty > 0) {
          await api.post("/api/stock", {
            action: "SUPPLIER_INCOME",
            itemId: result.id,
            quantity: qty,
            comment: "Начальный остаток",
          });
        }
        const savedQty = qty > 0 ? qty : 0;
        setSavedQuantities((prev) => ({ ...prev, [result.id]: savedQty }));
        setSessionItems((prev) => [
          ...prev,
          {
            id: result.id,
            name: addForm.name.trim(),
            typeId: addForm.typeId,
            unitId: addForm.unitId,
            quantity: quantity || "0",
            pricePerUnit: addForm.pricePerUnit,
          },
        ]);
        toast.success(`«${addForm.name.trim()}» создано`);
      }
      setAddForm({
        ...emptyItemFormValues,
        typeId: addForm.typeId,
        unitId: addForm.unitId,
      });
      setFormKey((k) => k + 1);
    } catch {
      // toast shown by api-client
    } finally {
      setAddSaving(false);
    }
  };

  const handleCloseBatch = () => {
    setShowAddForm(false);
    setAddForm({ ...emptyItemFormValues });
    setSessionItems([]);
    refreshAll();
  };

  const handleUpdateSession = (id: string, field: keyof SessionItem, value: string) => {
    setSessionItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveSession = async (item: SessionItem) => {
    try {
      await api.put(`/api/nomenclature/${item.id}`, {
        name: item.name.trim(),
        typeId: item.typeId,
        unitId: item.unitId,
        pricePerUnit: item.pricePerUnit ? Number(item.pricePerUnit) : null,
      });
    } catch {
      // toast shown by api-client
    }
  };

  const handleQuantityChange = async (item: SessionItem, newQuantityStr: string) => {
    const newQty = Number(newQuantityStr) || 0;
    const oldQty = savedQuantities[item.id] ?? 0;
    const delta = newQty - oldQty;
    if (delta === 0) return;

    try {
      await api.post("/api/stock", {
        action: "ADJUSTMENT",
        itemId: item.id,
        quantity: delta,
        comment: "Корректировка количества",
      });
      setSavedQuantities((prev) => ({ ...prev, [item.id]: newQty }));
    } catch {
      // toast shown by api-client — откатим UI
      setSessionItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, quantity: String(oldQty) } : i)
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/api/nomenclature/${deleteTarget.id}`);
      setSessionItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`«${deleteTarget.name}» удалено`);
    } catch {
      // toast shown by api-client
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-3">
      {!showAddForm && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Поиск по названию, артикулу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground text-sm h-9 w-full sm:max-w-xs"
          />
          {editMode && (
            <Button
              size="sm"
              className="h-9 text-xs sm:ml-auto"
              onClick={() => setShowAddForm(true)}
            >
              + Добавить позицию
            </Button>
          )}
        </div>
      )}

      {showAddForm && (
        <>
          <ItemForm
            key={formKey}
            mode="create"
            values={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={handleCloseBatch}
            saving={addSaving}
            title="Новая позиция"
            submitHint="Enter — создать и продолжить"
            cancelLabel="Готово"
            autoFocus
          />

          <SessionItemsList
            items={sessionItems}
            onUpdate={handleUpdateSession}
            onSave={handleSaveSession}
            onDelete={setDeleteTarget}
            onQuantityChange={handleQuantityChange}
          />
        </>
      )}

      {!showAddForm && (
      <>
        <p className="text-muted-foreground text-sm">{filtered.length} позиций</p>

        <GroupedAccordion
          items={sortedFiltered}
          groupBy={(item) => item.type}
          groupOrder={typeOrder}
          searchQuery={search || undefined}
          renderGroupHeader={(type, group) => (
            <>
              <Badge variant="outline" className={`text-sm px-2.5 py-0.5 ${typeColors[type]}`}>
                {itemTypeLabels[type]}
              </Badge>
              <span className="text-muted-foreground text-sm">{group.length} поз.</span>
            </>
          )}
          renderGroupContent={(_type, group) => (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-sm font-medium h-8 pl-10">Наименование</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium h-8 w-20 text-right">Остаток</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium h-8 w-24 text-right">Можно произвести</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium h-8 w-12 text-right">Ед.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border/50 cursor-pointer hover:bg-accent/50"
                    onClick={() => router.push(`/warehouse/nomenclature/${item.id}`)}
                  >
                    <TableCell className="py-2 pl-10">
                      <div>
                        <p className="text-foreground text-sm font-medium flex items-center gap-1">
                          <SideBadge side={item.side} />
                          {item.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <span className="text-foreground text-sm font-mono">
                        {formatNumber(balances[item.id] ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {item.type !== "material" && potentialMap[item.id] !== undefined ? (
                        <span className={`text-sm font-mono ${potentialMap[item.id] > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {formatNumber(potentialMap[item.id])}
                          {potentialMap[item.id] === 0 && bottleneckMap[item.id] && (
                            <span className="text-red-400 text-[10px] font-sans font-normal ml-1" title={`Не хватает: ${bottleneckMap[item.id]}`}>
                              ({bottleneckMap[item.id]})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <span className="text-muted-foreground text-sm">{unitLabels[item.unit]}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        />
      </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить позицию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» будет удалена из номенклатуры.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
