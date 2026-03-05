"use client";

import { useState } from "react";
import { Terminal } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";

type Role = "select" | "worker" | "warehouse";

export default function Home() {
  const [role, setRole] = useState<Role>("select");

  if (role === "worker") {
    return <Terminal />;
  }

  if (role === "warehouse") {
    // Редирект на страницу склада
    if (typeof window !== "undefined") {
      window.location.href = "/warehouse";
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4 gap-6">
      <h1 className="text-white text-lg font-semibold">Горчев-В</h1>
      <p className="text-zinc-400 text-sm">Выберите режим работы</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          className="h-14 text-base border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
          onClick={() => setRole("worker")}
        >
          Терминал рабочего
        </Button>
        <Button
          variant="outline"
          className="h-14 text-base border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
          onClick={() => setRole("warehouse")}
        >
          Склад (кладовщик)
        </Button>
      </div>
    </div>
  );
}
