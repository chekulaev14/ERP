"use client";

import { useState } from "react";
import { Terminal } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

type Role = "select" | "worker" | "warehouse";

export default function Home() {
  const [role, setRole] = useState<Role>("select");

  if (role === "worker") {
    return <Terminal />;
  }

  if (role === "warehouse") {
    if (typeof window !== "undefined") {
      window.location.href = "/warehouse";
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 gap-6 relative">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <h1 className="text-foreground text-lg font-semibold">Горчев-В</h1>
      <p className="text-muted-foreground text-sm">Выберите режим работы</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          className="h-14 text-base"
          onClick={() => setRole("worker")}
        >
          Терминал рабочего
        </Button>
        <Button
          variant="outline"
          className="h-14 text-base"
          onClick={() => setRole("warehouse")}
        >
          Склад (кладовщик)
        </Button>
      </div>
    </div>
  );
}
