import { Label } from "@/components/ui/label";

interface ToggleGroupOption<T extends string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

interface ToggleGroupProps<T extends string> {
  label: string;
  options: ToggleGroupOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 rounded-sm border px-1 py-1.5 transition-colors cursor-pointer ${
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            }`}
          >
            <div className="h-5 w-full px-0.5">{opt.icon}</div>
            <span className="text-[10px] leading-none">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
