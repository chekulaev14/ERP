"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NomenclatureTab } from "./NomenclatureTab";
import { StockTab } from "./StockTab";
import { OperationsTab } from "./OperationsTab";
import type { NomenclatureItem } from "@/data/nomenclature";

export function WarehousePanel() {
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <p className="text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <header className="px-4 py-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
        <h1 className="text-white text-base font-semibold">Склад</h1>
        <a
          href="/"
          className="text-zinc-400 text-xs hover:text-white transition-colors"
        >
          ← На главную
        </a>
      </header>

      <div className="p-4">
        <Tabs defaultValue="nomenclature" className="w-full">
          <TabsList className="bg-zinc-800 border border-zinc-700 mb-4">
            <TabsTrigger
              value="nomenclature"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs"
            >
              Номенклатура
            </TabsTrigger>
            <TabsTrigger
              value="stock"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs"
            >
              Остатки
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs"
            >
              Операции
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nomenclature">
            <NomenclatureTab items={items} balances={balances} />
          </TabsContent>
          <TabsContent value="stock">
            <StockTab items={items} balances={balances} onRefresh={fetchData} />
          </TabsContent>
          <TabsContent value="operations">
            <OperationsTab items={items} balances={balances} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
