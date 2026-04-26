"use client";

import { useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const HARMONIC_PRESETS: Record<string, number[]> = {
  sawtooth: Array.from({ length: 16 }, (_, i) => 1 / (i + 1)),
  square: Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 1 / (i + 1) : 0)),
  triangle: Array.from({ length: 16 }, (_, i) =>
    i % 2 === 0 ? ((-1) ** (i / 2)) / ((i + 1) ** 2) : 0,
  ).map(Math.abs),
  organ: [1, 0.8, 0, 0.6, 0, 0.4, 0, 0.3, 0, 0.2, 0, 0.15, 0, 0.1, 0, 0.08],
  bell: [1, 0.6, 0.3, 0.1, 0.4, 0.05, 0.2, 0.02, 0.15, 0.01, 0.08, 0, 0.05, 0, 0.03, 0],
};

interface HarmonicsEditorProps {
  harmonics: number[];
  onChange: (harmonics: number[]) => void;
}

export function HarmonicsEditor({ harmonics, onChange }: HarmonicsEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<number | null>(null);

  // Ensure we have at least 8 harmonics to display, pad with zeros
  const displayCount = Math.max(harmonics.length, 8);
  const displayHarmonics = Array.from(
    { length: displayCount },
    (_, i) => harmonics[i] ?? 0,
  );
  const maxVal = Math.max(...displayHarmonics.map(Math.abs), 1);

  const barWidth = 100 / displayCount;
  const barPad = barWidth * 0.15;

  const getBarIndex = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = 1 - (clientY - rect.top) / rect.height;
      const idx = Math.floor(x / barWidth);
      if (idx < 0 || idx >= displayCount) return null;
      return { index: idx, value: Math.max(0, Math.min(1, y)) * maxVal };
    },
    [barWidth, displayCount, maxVal],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      const result = getBarIndex(e.clientX, e.clientY);
      if (!result) return;
      draggingRef.current = result.index;

      const next = [...displayHarmonics];
      next[result.index] = Math.round(result.value * 100) / 100;
      // Trim trailing zeros
      while (next.length > 1 && next[next.length - 1] === 0) next.pop();
      onChange(next);

      (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
    },
    [getBarIndex, displayHarmonics, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingRef.current === null) return;
      const result = getBarIndex(e.clientX, e.clientY);
      if (!result) return;

      const next = [...displayHarmonics];
      next[result.index] = Math.round(result.value * 100) / 100;
      while (next.length > 1 && next[next.length - 1] === 0) next.pop();
      onChange(next);
    },
    [getBarIndex, displayHarmonics, onChange],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const addHarmonic = () => {
    onChange([...harmonics, 0]);
  };

  const removeHarmonic = () => {
    if (harmonics.length <= 1) return;
    onChange(harmonics.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Harmonics ({harmonics.length})</Label>
        <div className="flex gap-1">
          {Object.entries(HARMONIC_PRESETS).map(([name, values]) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[9px]"
              onClick={() => onChange([...values])}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 60"
        className="w-full h-24 rounded-md border bg-muted/30 cursor-crosshair select-none touch-none"
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {displayHarmonics.map((val, i) => {
          const barHeight = (Math.abs(val) / maxVal) * 56;
          const x = i * barWidth + barPad;
          const w = barWidth - barPad * 2;
          return (
            <rect
              key={i}
              x={x}
              y={60 - barHeight - 2}
              width={w}
              height={Math.max(barHeight, 0.5)}
              className={
                i < harmonics.length
                  ? "fill-primary/70"
                  : "fill-muted-foreground/20"
              }
              rx={0.5}
            />
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={58} x2={100} y2={58} className="stroke-muted-foreground/30" strokeWidth={0.3} />
      </svg>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] flex-1"
          onClick={addHarmonic}
        >
          + Harmonic
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] flex-1"
          onClick={removeHarmonic}
          disabled={harmonics.length <= 1}
        >
          − Harmonic
        </Button>
      </div>
    </div>
  );
}
