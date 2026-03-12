"use client";

import { useState, useEffect, useCallback } from "react";
import { useWarehouse } from "@/components/warehouse/WarehouseContext";
import { BomItemList } from "@/components/warehouse/bom-constructor/BomItemList";
import { RoutingEditor } from "./RoutingEditor";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import type { SideValidationError } from "@/services/helpers/validate-side";

export interface ProcessInfo {
  id: string;
  name: string;
}

export interface ProcessGroup {
  id: string;
  name: string;
  processes: ProcessInfo[];
}

export interface RoutingStepInputData {
  itemId: string;
  qty: number;
  sortOrder: number;
  item?: { id: string; name: string; code: string; typeId: string; unitId: string; side: string };
}

export interface RoutingStepData {
  id?: string;
  stepNo: number;
  processId: string;
  outputItemId: string;
  outputQty: number;
  normTimeMin?: number | null;
  setupTimeMin?: number | null;
  note?: string | null;
  process?: ProcessInfo;
  outputItem?: { id: string; name: string; code: string; typeId: string; unitId: string; side: string };
  inputs: RoutingStepInputData[];
}

export interface RoutingData {
  id: string;
  itemId: string;
  version: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  steps: RoutingStepData[];
}

export function RoutingConstructor() {
  const { items } = useWarehouse();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [routings, setRoutings] = useState<RoutingData[]>([]);
  const [processes, setProcesses] = useState<ProcessGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [sideErrors, setSideErrors] = useState<SideValidationError[]>([]);

  const eligibleItems = items.filter((i) => i.type === "blank" || i.type === "product");
  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  // Загрузить процессы один раз
  useEffect(() => {
    api.get<{ groups: ProcessGroup[] }>("/api/processes", { silent: true })
      .then((d) => setProcesses(d.groups))
      .catch(() => {});
  }, []);

  const loadRoutings = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const data = await api.get<RoutingData[]>(`/api/routing?itemId=${itemId}`, { silent: true });
      setRoutings(data);
    } catch {
      setRoutings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      loadRoutings(selectedItemId);
    } else {
      setRoutings([]);
    }
  }, [selectedItemId, loadRoutings]);

  const extractSideErrors = (err: unknown) => {
    if (err instanceof ApiError && Array.isArray(err.data.details)) {
      const errors = err.data.details as SideValidationError[];
      if (errors.length > 0 && errors[0].code?.startsWith("SIDE_")) {
        setSideErrors(errors);
      }
    }
  };

  const handleCreateRouting = async (steps: StepPayload[]) => {
    if (!selectedItemId) return;
    setSideErrors([]);
    try {
      await api.post("/api/routing", { itemId: selectedItemId, steps });
      toast.success("Маршрут создан");
      loadRoutings(selectedItemId);
    } catch (err) {
      extractSideErrors(err);
    }
  };

  const handleUpdateSteps = async (routingId: string, steps: StepPayload[]) => {
    setSideErrors([]);
    try {
      await api.put(`/api/routing/${routingId}`, { steps });
      toast.success("Маршрут сохранён");
      if (selectedItemId) loadRoutings(selectedItemId);
    } catch (err) {
      extractSideErrors(err);
    }
  };

  const handleActivate = async (routingId: string) => {
    setSideErrors([]);
    try {
      await api.put(`/api/routing/${routingId}/activate`);
      toast.success("Маршрут активирован");
      if (selectedItemId) loadRoutings(selectedItemId);
    } catch (err) {
      extractSideErrors(err);
    }
  };

  const handleDelete = async (routingId: string) => {
    try {
      await api.del(`/api/routing/${routingId}`);
      toast.success("Маршрут удалён");
      if (selectedItemId) loadRoutings(selectedItemId);
    } catch {
      // toast by api-client
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <BomItemList
        items={eligibleItems}
        selectedId={selectedItemId}
        onSelect={setSelectedItemId}
      />
      <div className="flex-1 overflow-auto">
        {selectedItem ? (
          <RoutingEditor
            item={selectedItem}
            allItems={items}
            routings={routings}
            processes={processes}
            loading={loading}
            sideErrors={sideErrors}
            onCreateRouting={handleCreateRouting}
            onUpdateSteps={handleUpdateSteps}
            onActivate={handleActivate}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Выберите позицию для редактирования маршрута
          </div>
        )}
      </div>
    </div>
  );
}

// Payload для API
export interface StepPayload {
  stepNo: number;
  processId: string;
  outputItemId: string;
  outputQty: number;
  inputs: { itemId: string; qty: number; sortOrder: number }[];
  normTimeMin?: number;
  setupTimeMin?: number;
  note?: string;
}
