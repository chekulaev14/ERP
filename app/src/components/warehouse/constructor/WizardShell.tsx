"use client";

import { Button } from "@/components/ui/button";
import { STEPS } from "./wizard-reducer";

interface WizardShellProps {
  step: number;
  onStepChange: (step: number) => void;
  canGoNext: boolean;
  creating: boolean;
  onCancel: () => void;
  onCreate: () => void;
  children: React.ReactNode;
}

export function WizardShell({
  step,
  onStepChange,
  canGoNext,
  creating,
  onCancel,
  onCreate,
  children,
}: WizardShellProps) {
  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.type} className="flex items-center">
            <button
              onClick={() => (i <= step || step === 3) && onStepChange(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                i === step
                  ? "bg-foreground text-background font-medium"
                  : i < step
                  ? "bg-accent text-foreground cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                  ? "bg-background text-foreground"
                  : "bg-muted-foreground/30 text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${i < step ? "bg-emerald-500" : "bg-border"}`} />
            )}
          </div>
        ))}
        <div className="flex items-center">
          <div className={`w-4 h-px mx-0.5 ${step === 3 ? "bg-emerald-500" : "bg-border"}`} />
          <button
            onClick={() => step === 3 && onStepChange(3)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
              step === 3
                ? "bg-foreground text-background font-medium"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 3 ? "bg-background text-foreground" : "bg-muted-foreground/30 text-muted-foreground"
            }`}>
              4
            </span>
            Итог
          </button>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>
            Отмена
          </Button>
          {step > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onStepChange(step - 1)}>
              Назад
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {step >= 0 && step <= 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => onStepChange(step + 1)}
            >
              Пропустить
            </Button>
          )}

          {step < 3 && (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => onStepChange(step + 1)}
              disabled={!canGoNext}
            >
              Далее
            </Button>
          )}

          {step === 3 && (
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onCreate}
              disabled={creating}
            >
              {creating ? "Создание..." : "Создать изделие"}
            </Button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
