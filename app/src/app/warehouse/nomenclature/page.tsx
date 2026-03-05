"use client";

import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { NomenclatureTab } from "@/components/warehouse/NomenclatureTab";

export default function NomenclaturePage() {
  const { items, balances } = useWarehouse();
  return <NomenclatureTab items={items} balances={balances} />;
}
