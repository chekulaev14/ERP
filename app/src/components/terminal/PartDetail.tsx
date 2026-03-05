"use client";

import { useState } from "react";
import { Part } from "@/data/catalog";
import { Button } from "@/components/ui/button";

interface PartDetailProps {
  part: Part;
  onSubmit: (quantity: number) => void;
}

export function PartDetail({ part, onSubmit }: PartDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleDigit = (digit: string) => {
    if (quantity.length < 5) {
      setQuantity(quantity + digit);
    }
  };

  const handleDelete = () => {
    setQuantity(quantity.slice(0, -1));
  };

  const handleSubmit = () => {
    const num = parseInt(quantity);
    if (num > 0) {
      setSubmitted(true);
      onSubmit(num);
      setTimeout(() => {
        setQuantity("");
        setSubmitted(false);
      }, 2000);
    }
  };

  const total = parseInt(quantity || "0") * part.pricePerUnit;

  return (
    <div className="space-y-3 max-w-md">
      <div className="relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
        <div className="aspect-[4/3] relative">
          <img
            src={part.images[currentImage]}
            alt={part.name}
            className="w-full h-full object-cover"
          />
          {part.images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {part.images.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentImage ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={() => setCurrentImage(i)}
                />
              ))}
            </div>
          )}
        </div>
        {part.images.length > 1 && (
          <>
            <button
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center"
              onClick={() =>
                setCurrentImage((currentImage - 1 + part.images.length) % part.images.length)
              }
            >
              ‹
            </button>
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center"
              onClick={() =>
                setCurrentImage((currentImage + 1) % part.images.length)
              }
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="bg-zinc-800 rounded-lg p-2.5 border border-zinc-700">
        <h2 className="text-white text-sm font-medium mb-0.5">{part.name}</h2>
        <p className="text-zinc-400 text-xs">{part.description}</p>
        <p className="text-emerald-400 text-xs mt-1">Оплата за 1 ед.: {part.pricePerUnit} ₽</p>
      </div>

      {submitted ? (
        <div className="bg-emerald-900/50 border border-emerald-700 rounded-lg p-3 text-center">
          <p className="text-emerald-400 text-sm font-medium">Данные отправлены</p>
          <p className="text-emerald-300/70 text-xs mt-0.5">
            {quantity} шт × {part.pricePerUnit} ₽ = {total} ₽
          </p>
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
          <p className="text-zinc-400 text-xs mb-2">Количество сделанных деталей:</p>

          <div className="bg-zinc-900 rounded-lg px-3 py-2 mb-3 text-center min-h-[36px] flex items-center justify-center">
            {quantity ? (
              <div>
                <span className="text-white text-2xl font-bold">{quantity}</span>
                <span className="text-zinc-500 text-sm ml-1.5">шт</span>
                {total > 0 && (
                  <p className="text-emerald-400 text-xs mt-0.5">= {total} ₽</p>
                )}
              </div>
            ) : (
              <span className="text-zinc-600 text-lg">0</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
              (digit, i) => {
                if (digit === "") return <div key={i} />;
                if (digit === "⌫") {
                  return (
                    <Button
                      key={i}
                      variant="outline"
                      className="h-9 text-base rounded-lg border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-700"
                      onClick={handleDelete}
                    >
                      ⌫
                    </Button>
                  );
                }
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-9 text-lg font-semibold rounded-lg border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-700"
                    onClick={() => handleDigit(digit)}
                  >
                    {digit}
                  </Button>
                );
              }
            )}
          </div>

          <Button
            className="w-full h-9 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30"
            disabled={!quantity || parseInt(quantity) === 0}
            onClick={handleSubmit}
          >
            Отправить
          </Button>
        </div>
      )}
    </div>
  );
}
