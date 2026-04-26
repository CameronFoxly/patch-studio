"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

function first(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  action?: React.ReactNode;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
  action,
}: SliderInputProps) {
  const [text, setText] = useState(() => formatDisplay(value));
  const [focused, setFocused] = useState(false);

  function formatValue(v: number): string {
    if (format) return format(v);
    const decimals = step < 0.01 ? 3 : step < 1 ? 2 : step < 10 ? 1 : 0;
    return v.toFixed(decimals);
  }

  function formatDisplay(v: number): string {
    const val = formatValue(v);
    return unit ? `${val} ${unit}` : val;
  }

  useEffect(() => {
    if (!focused) {
      setText(formatDisplay(value));
    }
  }, [value, focused]);

  const commitText = useCallback(() => {
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
    setText(formatValue(value));
  }, [text, min, max, value, onChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs shrink-0">{label}</Label>
          {action}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={focused ? text : formatDisplay(value)}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setText(formatValue(value));
          }}
          onBlur={() => {
            setFocused(false);
            commitText();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="h-6 w-20 rounded border border-input bg-background px-1.5 text-right text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(first(v))}
      />
    </div>
  );
}
