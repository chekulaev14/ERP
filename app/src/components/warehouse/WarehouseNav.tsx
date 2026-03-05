"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/warehouse/nomenclature", label: "Номенклатура" },
  { href: "/warehouse/stock", label: "Остатки" },
  { href: "/warehouse/assembly", label: "Сборка" },
  { href: "/warehouse/operations", label: "Операции" },
];

export function WarehouseNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {navItems.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
