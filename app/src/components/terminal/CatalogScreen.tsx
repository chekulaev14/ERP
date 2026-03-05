"use client";

import { useState } from "react";
import { categories, Category, Product, Part } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartDetail } from "./PartDetail";

interface CatalogScreenProps {
  workerName: string;
  onLogout: () => void;
  onSubmit: (partId: string, partName: string, quantity: number, pricePerUnit: number) => void;
}

type View =
  | { type: "categories" }
  | { type: "products"; category: Category }
  | { type: "parts"; product: Product }
  | { type: "partDetail"; part: Part; product: Product };

export function CatalogScreen({ workerName, onLogout, onSubmit }: CatalogScreenProps) {
  const [view, setView] = useState<View>({ type: "categories" });

  const handleBack = () => {
    switch (view.type) {
      case "products":
        setView({ type: "categories" });
        break;
      case "parts":
        setView({ type: "categories" });
        break;
      case "partDetail":
        setView({ type: "parts", product: view.product });
        break;
    }
  };

  const title = (() => {
    switch (view.type) {
      case "categories":
        return "Каталог изделий";
      case "products":
        return view.category.name;
      case "parts":
        return view.product.name;
      case "partDetail":
        return view.part.name;
    }
  })();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <header className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          {view.type !== "categories" && (
            <Button
              variant="ghost"
              className="text-zinc-300 hover:text-white text-base px-2 h-8"
              onClick={handleBack}
            >
              ←
            </Button>
          )}
          <h1 className="text-sm font-semibold text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs">{workerName}</span>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 h-7 text-xs px-2"
            onClick={onLogout}
          >
            Выход
          </Button>
        </div>
      </header>

      <main className="flex-1 p-3 overflow-y-auto">
        {view.type === "categories" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="bg-zinc-800 border-zinc-700 cursor-pointer hover:border-zinc-500 active:bg-zinc-700 transition-all overflow-hidden"
                onClick={() => setView({ type: "products", category: cat })}
              >
                <div className="aspect-square relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-1.5">
                  <h3 className="text-white font-medium text-xs">{cat.name}</h3>
                  <p className="text-zinc-500 text-[10px]">{cat.products.length} изд.</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {view.type === "products" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {view.category.products.map((product) => (
              <Card
                key={product.id}
                className="bg-zinc-800 border-zinc-700 cursor-pointer hover:border-zinc-500 active:bg-zinc-700 transition-all overflow-hidden"
                onClick={() => setView({ type: "parts", product })}
              >
                <div className="aspect-square relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-1.5">
                  <h3 className="text-white font-medium text-xs">{product.name}</h3>
                  <p className="text-zinc-500 text-[10px]">{product.parts.length} дет.</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {view.type === "parts" && (
          <div className="space-y-2">
            <div className="bg-zinc-800 rounded-lg p-2 border border-zinc-700">
              <p className="text-zinc-400 text-xs">{view.product.description}</p>
            </div>
            <h2 className="text-sm font-medium text-zinc-300">Комплектующие:</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {view.product.parts.map((part) => (
                <Card
                  key={part.id}
                  className="bg-zinc-800 border-zinc-700 cursor-pointer hover:border-zinc-500 active:bg-zinc-700 transition-all overflow-hidden"
                  onClick={() => setView({ type: "partDetail", part, product: view.product })}
                >
                  <div className="aspect-square relative">
                    <img
                      src={part.images[0]}
                      alt={part.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-1.5">
                    <h3 className="text-white font-medium text-[11px]">{part.name}</h3>
                    <p className="text-emerald-400 text-[10px]">{part.pricePerUnit} ₽/шт</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {view.type === "partDetail" && (
          <PartDetail
            part={view.part}
            onSubmit={(quantity) =>
              onSubmit(view.part.id, view.part.name, quantity, view.part.pricePerUnit)
            }
          />
        )}
      </main>
    </div>
  );
}
