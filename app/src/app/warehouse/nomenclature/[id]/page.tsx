"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { BomView } from "@/components/warehouse/BomView";

export default function NomenclatureItemPage() {
  const { id } = useParams<{ id: string }>();
  const { items, balances } = useWarehouse();

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <div>
        <Link
          href="/warehouse/nomenclature"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Назад к номенклатуре
        </Link>
        <p className="text-muted-foreground text-sm mt-4">Позиция не найдена</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <Link
          href="/warehouse/nomenclature"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Номенклатура
        </Link>
        <span className="text-muted-foreground/50 text-xs">/</span>
        <span className="text-foreground text-xs font-medium">{item.name}</span>
      </div>
      <BomView item={item} balances={balances} />
    </div>
  );
}
