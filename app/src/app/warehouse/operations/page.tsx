"use client";

import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { OperationsTab } from "@/components/warehouse/OperationsTab";

export default function OperationsPage() {
  const { items, balances, refresh } = useWarehouse();
  return <OperationsTab items={items} balances={balances} onRefresh={refresh} />;
}
