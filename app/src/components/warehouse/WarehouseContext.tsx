"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { NomenclatureItem } from "@/data/nomenclature";

interface WarehouseContextType {
  items: NomenclatureItem[];
  balances: Record<string, number>;
  loading: boolean;
  refresh: () => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}

const WarehouseContext = createContext<WarehouseContextType | null>(null);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [nomRes, stockRes] = await Promise.all([
        fetch("/api/nomenclature"),
        fetch("/api/stock"),
      ]);
      const nomData = await nomRes.json();
      const stockData = await stockRes.json();
      setItems(nomData.items);
      setBalances(stockData.balances);
    } catch (e) {
      console.error("Ошибка загрузки данных:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <WarehouseContext.Provider value={{ items, balances, loading, refresh: fetchData, editMode, setEditMode }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouse must be used within WarehouseProvider");
  return ctx;
}
