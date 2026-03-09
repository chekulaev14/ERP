interface ChainArrowProps {
  quantity: number;
  unit?: string;
  onChange: (qty: number) => void;
}

export function ChainArrow({ quantity, unit, onChange }: ChainArrowProps) {
  return (
    <div className="flex flex-col items-center shrink-0 mx-2">
      <input
        type="number"
        value={quantity}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 text-center text-base font-medium border border-input rounded-lg py-1.5 px-2 bg-background"
        min={0.001}
        step="any"
      />
      {unit && <span className="text-sm text-muted-foreground mt-0.5">{unit}</span>}
      <div className="relative w-12 h-0.5 bg-slate-400 mt-1.5">
        <div className="absolute right-0 -top-[4px] border-[5px] border-transparent border-l-[6px] border-l-slate-400" />
      </div>
    </div>
  );
}
