"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";

interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  size?: number;
}

const ARC_START = 225; // degrees from 12 o'clock — gap centered at bottom (6 o'clock)
const ARC_SWEEP = 270; // total arc degrees

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function RotaryKnob({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
  onDragStart,
  onDragEnd,
  size = 72,
}: RotaryKnobProps) {
  const [text, setText] = useState(() => formatDisplay(value));
  const [focused, setFocused] = useState(false);
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);
  const knobRef = useRef<SVGSVGElement>(null);

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
      const snapped = Math.round(clamped / step) * step;
      onChange(snapped);
    }
    setText(formatDisplay(value));
  }, [text, min, max, step, value, onChange]);

  // Normalized value 0-1
  const norm = (value - min) / (max - min);
  const currentAngle = ARC_START + norm * ARC_SWEEP;

  // SVG geometry
  const svgSize = size;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const trackRadius = svgSize / 2 - 4;
  const indicatorRadius = trackRadius - 6;

  // Pointer on the knob
  const pointer = polarToCartesian(cx, cy, indicatorRadius, currentAngle);
  const pointerInner = polarToCartesian(cx, cy, indicatorRadius * 0.45, currentAngle);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startValue: value };
      onDragStart?.();
    },
    [value, onDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.startY - e.clientY;
      // 200px of drag = full range
      const sensitivity = (max - min) / 200;
      const raw = dragRef.current.startValue + dy * sensitivity;
      const clamped = Math.min(max, Math.max(min, raw));
      const snapped = Math.round(clamped / step) * step;
      onChange(snapped);
    },
    [min, max, step, onChange],
  );

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
      onDragEnd?.();
    }
  }, [onDragEnd]);

  return (
    <div className="flex flex-col items-center gap-1 w-16">
      <Label className="text-[10px] text-muted-foreground truncate max-w-full text-center">
        {label}
      </Label>

      <svg
        ref={knobRef}
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="cursor-ns-resize select-none"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Track background arc */}
        <path
          d={describeArc(cx, cy, trackRadius, ARC_START, ARC_START + ARC_SWEEP)}
          fill="none"
          className="stroke-muted pointer-events-none"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {norm > 0.005 && (
          <path
            d={describeArc(cx, cy, trackRadius, ARC_START, currentAngle)}
            fill="none"
            className="stroke-emerald-500 pointer-events-none"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Knob body */}
        <circle cx={cx} cy={cy} r={indicatorRadius} className="fill-muted stroke-border pointer-events-none" strokeWidth={1} />

        {/* Indicator line */}
        <line
          x1={pointerInner.x}
          y1={pointerInner.y}
          x2={pointer.x}
          y2={pointer.y}
          className="stroke-emerald-500 pointer-events-none"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Invisible hit area on top to prevent cursor flicker */}
        <rect x={0} y={0} width={svgSize} height={svgSize} fill="transparent" className="cursor-ns-resize" />
      </svg>

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
        className="h-5 w-full max-w-16 rounded border border-input bg-background px-1 text-center text-[10px] tabular-nums outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
