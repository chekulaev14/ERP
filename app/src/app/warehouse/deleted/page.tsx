"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import {
  type NomenclatureItem,
  type ItemType,
  itemTypeLabels,
  unitLabels,
} from "@/data/nomenclature";

const typeColors: Record<ItemType, string> = {
  material: "bg-amber-100 text-amber-800 border-amber-300",
  blank: "bg-orange-100 text-orange-800 border-orange-300",
  part: "bg-blue-100 text-blue-800 border-blue-300",
  subassembly: "bg-purple-100 text-purple-800 border-purple-300",
  product: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function DeletedPage() {
  const { refresh } = useWarehouse();
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/nomenclature?deleted=1")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      const res = await fetch(`/api/nomenclature/${id}`, { method: "PATCH" });
      if (res.ok) {
        load();
        refresh();
      }
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Загрузка...</p>;
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Нет удалённых позиций</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{items.length} удалённых позиций</p>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-sm font-medium h-8">Наименование</TableHead>
              <TableHead className="text-muted-foreground text-sm font-medium h-8 w-24">Тип</TableHead>
              <TableHead className="text-muted-foreground text-sm font-medium h-8 w-12 text-right">Ед.</TableHead>
              <TableHead className="text-muted-foreground text-sm font-medium h-8 w-28 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-border/50">
                <TableCell className="py-2">
                  <p className="text-foreground text-sm">{item.name}</p>
                  {item.description && (
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 ${typeColors[item.type]}`}>
                    {itemTypeLabels[item.type]}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-right">
                  <span className="text-muted-foreground text-sm">{unitLabels[item.unit]}</span>
                </TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleRestore(item.id)}
                    disabled={restoring === item.id}
                  >
                    {restoring === item.id ? "..." : "Восстановить"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
