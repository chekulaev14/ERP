"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useWarehouse } from "../WarehouseContext";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { LocalBomMap } from "./types";

export function useConstructorBom(productId: string | null) {
  const { bomChildren, refresh } = useWarehouse();
  const [localBom, setLocalBom] = useState<LocalBomMap>({});
  // columnsBom — стабильная копия для расчёта колонок.
  // Обновляется при загрузке и addLink, НЕ при removeLink.
  const [columnsBom, setColumnsBom] = useState<LocalBomMap>({});
  const [saving, setSaving] = useState(false);

  // Загрузка из bomChildren → localBom + columnsBom
  useEffect(() => {
    if (!productId) {
      setLocalBom({});
      setColumnsBom({});
      return;
    }

    const bom: LocalBomMap = {};
    const visited = new Set<string>();

    function collect(parentId: string) {
      if (visited.has(parentId)) return;
      visited.add(parentId);

      const children = bomChildren[parentId];
      if (!children || children.length === 0) return;

      bom[parentId] = children.map((c) => ({
        childId: c.item.id,
        quantity: c.quantity,
      }));

      for (const child of children) {
        collect(child.item.id);
      }
    }

    collect(productId);
    setLocalBom(bom);
    setColumnsBom(bom);
  }, [productId, bomChildren]);

  // --- Helpers ---

  function cleanOrphans(bom: LocalBomMap, rootId: string): LocalBomMap {
    const reachable = new Set<string>();
    function walk(id: string) {
      if (reachable.has(id)) return;
      reachable.add(id);
      for (const c of bom[id] || []) walk(c.childId);
    }
    walk(rootId);

    const clean: LocalBomMap = {};
    for (const [pid, children] of Object.entries(bom)) {
      if (reachable.has(pid)) clean[pid] = children;
    }
    return clean;
  }

  // --- CRUD ---

  const addLink = useCallback((parentId: string, childId: string) => {
    const updater = (prev: LocalBomMap) => {
      const existing = prev[parentId] || [];
      if (existing.some((c) => c.childId === childId)) return prev;
      return { ...prev, [parentId]: [...existing, { childId, quantity: 1 }] };
    };
    setLocalBom(updater);
    setColumnsBom(updater); // Обновляем колонки при добавлении
  }, []);

  const removeLink = useCallback((parentId: string, childId: string) => {
    // Обновляем только localBom (линии/save), НЕ columnsBom (позиции карточек)
    setLocalBom((prev) => {
      const existing = prev[parentId];
      if (!existing) return prev;
      const filtered = existing.filter((c) => c.childId !== childId);
      const next = { ...prev };
      if (filtered.length === 0) delete next[parentId];
      else next[parentId] = filtered;
      return next;
    });
  }, []);

  const updateQuantity = useCallback((parentId: string, childId: string, qty: number) => {
    const updater = (prev: LocalBomMap) => {
      const existing = prev[parentId];
      if (!existing) return prev;
      return {
        ...prev,
        [parentId]: existing.map((c) =>
          c.childId === childId ? { ...c, quantity: qty } : c,
        ),
      };
    };
    setLocalBom(updater);
    setColumnsBom(updater);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    if (!productId) return;
    const pid = productId;
    const updater = (prev: LocalBomMap) => {
      const next = { ...prev };
      delete next[itemId];
      for (const [parentKey, children] of Object.entries(next)) {
        const filtered = children.filter((c) => c.childId !== itemId);
        if (filtered.length === 0) delete next[parentKey];
        else next[parentKey] = filtered;
      }
      return cleanOrphans(next, pid);
    };
    setLocalBom(updater);
    setColumnsBom(updater); // Карточка удаляется — обновляем колонки
  }, [productId]);

  // --- isDirty ---

  const serverKey = useMemo(() => {
    if (!productId) return "";
    const pairs: string[] = [];
    const visited = new Set<string>();
    function collect(parentId: string) {
      if (visited.has(parentId)) return;
      visited.add(parentId);
      for (const c of bomChildren[parentId] || []) {
        pairs.push(`${parentId}:${c.item.id}:${c.quantity}`);
        collect(c.item.id);
      }
    }
    collect(productId);
    return pairs.sort().join("|");
  }, [productId, bomChildren]);

  const localKey = useMemo(() => {
    const pairs: string[] = [];
    for (const [pid, children] of Object.entries(localBom)) {
      for (const c of children) {
        pairs.push(`${pid}:${c.childId}:${c.quantity}`);
      }
    }
    return pairs.sort().join("|");
  }, [localBom]);

  const isDirty = serverKey !== localKey;

  // --- Save (diff) ---

  const save = useCallback(async () => {
    if (!productId) return;
    setSaving(true);
    try {
      const serverLinks = new Map<string, number>();
      const visited = new Set<string>();
      function collectServer(parentId: string) {
        if (visited.has(parentId)) return;
        visited.add(parentId);
        for (const c of bomChildren[parentId] || []) {
          serverLinks.set(`${parentId}:${c.item.id}`, c.quantity);
          collectServer(c.item.id);
        }
      }
      collectServer(productId);

      const localLinks = new Map<string, number>();
      for (const [pid, children] of Object.entries(localBom)) {
        for (const c of children) {
          localLinks.set(`${pid}:${c.childId}`, c.quantity);
        }
      }

      for (const key of serverLinks.keys()) {
        if (!localLinks.has(key)) {
          const [parentId, childId] = key.split(":");
          await api.del("/api/bom", { parentId, childId });
        }
      }

      for (const [key, qty] of localLinks.entries()) {
        if (!serverLinks.has(key)) {
          const [parentId, childId] = key.split(":");
          await api.post("/api/bom", { parentId, childId, quantity: qty });
        }
      }

      for (const [key, qty] of localLinks.entries()) {
        const serverQty = serverLinks.get(key);
        if (serverQty !== undefined && serverQty !== qty) {
          const [parentId, childId] = key.split(":");
          await api.put("/api/bom", { parentId, childId, quantity: qty });
        }
      }

      toast.success("BOM сохранён");
      refresh();
    } catch {
      // api-client покажет toast
    } finally {
      setSaving(false);
    }
  }, [productId, localBom, bomChildren, refresh]);

  return {
    localBom, columnsBom, addLink, removeLink, updateQuantity, removeItem,
    isDirty, save, saving,
  };
}
