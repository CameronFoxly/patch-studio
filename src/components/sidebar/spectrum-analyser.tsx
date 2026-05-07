"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useSpectrumAnalyser } from "@/hooks/use-spectrum-analyser";
import { useStore } from "@/lib/store";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Frequency range constants
const MIN_FREQ = 20;
const MAX_FREQ = 20_000;
const SAMPLE_RATE = 44_100; // default Web Audio sample rate

// Frequency labels for the axis
const FREQ_LABELS = [20, 50, 100, 200, 500, "1k", "2k", "5k", "10k", "20k"];
const FREQ_VALUES = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000];

const MIN_HEIGHT = 48;
const DEFAULT_HEIGHT = 120;
const MAX_HEIGHT = 300;

// Dot grid settings (in CSS pixels, scaled by DPR at draw time)
const DOT_RADIUS = 2; // 4px diameter
const DOT_GAP = 2.5; // gap between dots
const DOT_STEP = DOT_RADIUS * 2 + DOT_GAP; // centre-to-centre distance

// Gradient colours: lilac/violet-400 (bottom) → emerald-500 (top)
const COLOR_LOW: [number, number, number] = [167, 139, 250]; // #a78bfa
const COLOR_HIGH: [number, number, number] = [16, 185, 129]; // #10b981

function lerpColor(t: number): string {
  const r = Math.round(COLOR_LOW[0] + (COLOR_HIGH[0] - COLOR_LOW[0]) * t);
  const g = Math.round(COLOR_LOW[1] + (COLOR_HIGH[1] - COLOR_LOW[1]) * t);
  const b = Math.round(COLOR_LOW[2] + (COLOR_HIGH[2] - COLOR_LOW[2]) * t);
  return `rgb(${r},${g},${b})`;
}

/** Map a frequency (Hz) to a normalised 0–1 position (log scale). */
function freqToX(freq: number): number {
  return Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ);
}

export function SpectrumAnalyser() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlaying = useStore((s) => s.isPlaying);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragging = useRef(false);

  // Pre-computed row colour LUT (rebuilt when height changes)
  const colorLutRef = useRef<string[]>([]);

  // Resize handle at the top of the panel
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      const startY = e.clientY;
      const startH = height;

      const onMove = (ev: PointerEvent) => {
        const delta = startY - ev.clientY;
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH + delta)));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [height],
  );

  // Handle canvas resize & rebuild colour LUT
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const sync = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Rebuild colour LUT for current row count
      const axisH = 16 * dpr;
      const plotH = canvas.height - axisH;
      const step = DOT_STEP * dpr;
      const rows = Math.max(1, Math.floor(plotH / step));
      const lut: string[] = new Array(rows);
      for (let r = 0; r < rows; r++) {
        lut[r] = lerpColor(r / (rows - 1 || 1));
      }
      colorLutRef.current = lut;
    };

    const observer = new ResizeObserver(sync);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const drawGrid = useCallback(
    (frequencyData: Uint8Array | null, binCount: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const axisH = 16 * dpr;
      const plotH = h - axisH;
      const plotW = w;
      const step = DOT_STEP * dpr;
      const radius = DOT_RADIUS * dpr;

      // Frequency labels
      ctx.save();
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("color");
      ctx.font = `${9 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < FREQ_VALUES.length; i++) {
        const x = freqToX(FREQ_VALUES[i]) * plotW;
        ctx.fillText(String(FREQ_LABELS[i]), x, h - 2 * dpr);
      }
      ctx.restore();

      // Dot grid
      const cols = Math.max(1, Math.floor(plotW / step));
      const rows = Math.max(1, Math.floor(plotH / step));
      const lut = colorLutRef.current;
      const padX = (plotW - cols * step) / 2 + step / 2;
      const padY = (plotH - rows * step) / 2 + step / 2;

      const binFreq = binCount > 0 ? SAMPLE_RATE / (binCount * 2) : 0;

      for (let col = 0; col < cols; col++) {
        let litRows = 0;
        if (frequencyData && binCount > 0) {
          const fLow = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, col / cols);
          const fHigh = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (col + 1) / cols);
          const binLow = Math.max(0, Math.floor(fLow / binFreq));
          const binHigh = Math.min(binCount - 1, Math.ceil(fHigh / binFreq));
          if (binLow <= binCount - 1) {
            let maxVal = 0;
            for (let b = binLow; b <= binHigh; b++) {
              if (frequencyData[b] > maxVal) maxVal = frequencyData[b];
            }
            litRows = Math.round((maxVal / 255) * rows);
          }
        }

        const cx = padX + col * step;
        const dimColor = getComputedStyle(canvas).getPropertyValue("color");

        for (let row = 0; row < rows; row++) {
          const isLit = row < litRows;
          const cy = plotH - padY - row * step;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          if (isLit) {
            ctx.fillStyle = lut[row] ?? lut[lut.length - 1];
            ctx.globalAlpha = 0.9;
          } else {
            ctx.fillStyle = dimColor;
            ctx.globalAlpha = 0.06;
          }
          ctx.fill();
        }
      }
    },
    [],
  );

  const draw = useCallback(
    (frequencyData: Uint8Array, binCount: number) => {
      drawGrid(frequencyData, binCount);
    },
    [drawGrid],
  );

  const [collapsed, setCollapsed] = useState(false);

  useSpectrumAnalyser(draw, isPlaying && !collapsed);

  // Draw empty grid when not playing or on mount
  useEffect(() => {
    if (!isPlaying && !collapsed) {
      // Small delay to ensure canvas is sized
      requestAnimationFrame(() => drawGrid(null, 0));
    }
  }, [isPlaying, height, collapsed, drawGrid]);

  return (
    <div className="border-t bg-card shrink-0">
      {/* Resize handle — hidden when collapsed */}
      {!collapsed && (
        <div
          className="h-1.5 shrink-0 bg-border hover:bg-primary/20 transition-colors cursor-row-resize active:bg-primary/40"
          onPointerDown={onResizePointerDown}
        />
      )}
      {/* Label */}
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Analyzer
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            20 Hz — 20 kHz
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand analyzer" : "Collapse analyzer"}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </button>
        </div>
      </div>
      {/* Canvas container — inset card */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <div
            ref={containerRef}
            className="relative rounded-md border bg-background"
            style={{ height }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full text-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}
