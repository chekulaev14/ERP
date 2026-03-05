"use client";

import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { AssemblyTab } from "@/components/warehouse/AssemblyTab";

export default function AssemblyPage() {
  const { items, balances } = useWarehouse();
  return <AssemblyTab items={items} balances={balances} />;
}
