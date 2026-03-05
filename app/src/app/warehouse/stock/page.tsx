"use client";

import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { StockTab } from "@/components/warehouse/StockTab";

export default function StockPage() {
  const { items, balances, refresh } = useWarehouse();
  return <StockTab items={items} balances={balances} onRefresh={refresh} />;
}
