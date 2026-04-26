"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";

interface VolumeFaderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  amplitude?: number; // 0-1, live signal level for meter visualization
  clipThreshold?: number; // amplitude level above which clipping warning shows (default 0.95)
  height?: number; // track height in px (default 120)
}

const METER_COLORS = {
  low: "#22c55e",    // green
  mid: "#eab308",    // yellow
  high: "#ef4444",   // red
};

function getMeterColor(normLevel: number): string {
  if (normLevel < 0.6) return METER_COLORS.low;
  if (normLevel < 0.85) return METER_COLORS.mid;
  return METER_COLORS.high;
}

export function VolumeFader({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
  amplitude = 0,
  clipThreshold = 0.95,
  height = 120,
}: VolumeFaderProps) {
  const [text, setText] = useState(() => formatDisplay(value));
  const [focused, setFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const norm = (value - min) / (max - min);
  const isClipping = amplitude >= clipThreshold;

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
    if (!focused) setText(formatDisplay(value));
  }, [value, focused]);

  const commitText = useCallback(() => {
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      const snapped = Math.round(clamped / step) * step;
      onChange(snapped);
    }
    setText(formatDisplay(value));
  }, [text, min, max, step, value, onChange]);

  const valueFromY = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      // Invert: top = max, bottom = min
      const normY = 1 - (clientY - rect.top) / rect.height;
      const clamped = Math.min(1, Math.max(0, normY));
      const raw = min + clamped * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setIsDragging(true);
      onChange(valueFromY(e.clientY));
    },
    [onChange, valueFromY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onChange(valueFromY(e.clientY));
    },
    [isDragging, onChange, valueFromY],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Meter level (amplitude visualization)
  const meterNorm = Math.min(1, Math.max(0, amplitude));

  // Thumb position: percentage from bottom
  const thumbBottom = norm * 100;

  return (
    <div className="flex flex-col items-center gap-1.5 w-14">
      <Label className="text-[10px] text-muted-foreground text-center">{label}</Label>

      <div className="flex gap-1 items-stretch" style={{ height }}>
        {/* Fader track */}
        <div
          ref={trackRef}
          className="relative w-6 rounded-[3px] bg-muted border border-border select-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Value fill (shows current fader level) */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-sm bg-neutral-400/30 dark:bg-neutral-500/30"
            style={{ height: `${norm * 100}%` }}
          />

          {/* Rectangular thumb */}
          <div
            className={`absolute left-0 right-0 h-3 rounded-[2px] border transition-colors ${
              isDragging
                ? "bg-neutral-50 dark:bg-neutral-300 border-primary shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-400 border-border hover:border-primary/60"
            } ${isClipping ? "ring-1 ring-red-500 border-red-500" : ""}`}
            style={{
              bottom: `calc(${thumbBottom}% - 6px)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {/* Grip lines on thumb */}
            <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 flex flex-col gap-px">
              <div className="h-px bg-current opacity-20" />
              <div className="h-px bg-current opacity-20" />
            </div>
          </div>
        </div>

        {/* Amplitude meter bar (separate from fader) */}
        <div className="relative w-1.5 rounded-[2px] bg-neutral-800 dark:bg-neutral-900 border border-border/50 overflow-hidden">
          {amplitude > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-75"
              style={{
                height: `${meterNorm * 100}%`,
                backgroundColor: getMeterColor(meterNorm),
              }}
            />
          )}
          {/* Clipping indicator */}
          {isClipping && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse" />
          )}
        </div>
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
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-5 w-full max-w-12 rounded border border-input bg-background px-1 text-center text-[10px] tabular-nums outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
