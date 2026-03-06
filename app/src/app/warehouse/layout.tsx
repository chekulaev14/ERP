"use client";

import { useRouter } from "next/navigation";
import { WarehouseProvider, useWarehouse } from "@/components/warehouse/WarehouseContext";
import { WarehouseNav } from "@/components/warehouse/WarehouseNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const { loading, editMode, setEditMode } = useWarehouse();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-foreground text-base font-semibold">Склад</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={editMode ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs whitespace-nowrap"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Выйти" : "Ред."}
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <WarehouseNav />
          {editMode && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => router.push("/warehouse/deleted")}
              >
                Удалённые
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => router.push("/warehouse/builder")}
              >
                Конструктор изделия
              </Button>
            </div>
          )}
        </div>
      </header>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseProvider>
      <WarehouseLayout>{children}</WarehouseLayout>
    </WarehouseProvider>
  );
}
