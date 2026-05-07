"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useSpectrumAnalyser } from "@/hooks/use-spectrum-analyser";
import { useOfflineAnalyser } from "@/hooks/use-offline-analyser";
import { useStore } from "@/lib/store";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Frequency range constants
const MIN_FREQ = 20;
const MAX_FREQ = 20_000;
const SAMPLE_RATE = 44_100;

// Frequency labels for the axis
const FREQ_LABELS = [20, 50, 100, 200, 500, "1k", "2k", "5k", "10k", "20k"];
const FREQ_VALUES = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000];

const MIN_HEIGHT = 48;
const DEFAULT_HEIGHT = 120;
const MAX_HEIGHT = 300;

// Bar colour: emerald-600 (#059669)
const BAR_COLOR = "5, 150, 105";
const BAR_ALPHA_TOP = 1.0;
const BAR_ALPHA_BOTTOM = 0.5;

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

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const sync = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
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

      // Vertical 1px lines — one per CSS pixel across the x axis
      const cols = Math.max(1, Math.floor(plotW / dpr));
      const binFreq = binCount > 0 ? SAMPLE_RATE / (binCount * 2) : 0;

      for (let col = 0; col < cols; col++) {
        if (!frequencyData || binCount <= 0) continue;

        const fLow = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, col / cols);
        const fHigh = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (col + 1) / cols);
        const binLow = Math.max(0, Math.floor(fLow / binFreq));
        const binHigh = Math.min(binCount - 1, Math.ceil(fHigh / binFreq));
        if (binLow > binCount - 1) continue;

        let maxVal = 0;
        for (let b = binLow; b <= binHigh; b++) {
          if (frequencyData[b] > maxVal) maxVal = frequencyData[b];
        }

        const barHeight = (maxVal / 255) * plotH;
        if (barHeight < 0.5) continue;

        const x = col * dpr;
        const yTop = plotH - barHeight;

        // Gradient: full opacity at top → 50% opacity at bottom
        const grad = ctx.createLinearGradient(0, yTop, 0, plotH);
        grad.addColorStop(0, `rgba(${BAR_COLOR}, ${BAR_ALPHA_TOP})`);
        grad.addColorStop(1, `rgba(${BAR_COLOR}, ${BAR_ALPHA_BOTTOM})`);

        ctx.fillStyle = grad;
        ctx.fillRect(x, yTop, dpr, barHeight);
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
  useOfflineAnalyser(drawGrid, !isPlaying && !collapsed);

  // Draw empty grid when not playing or on mount
  useEffect(() => {
    if (!isPlaying && !collapsed) {
      requestAnimationFrame(() => drawGrid(null, 0));
    }
  }, [isPlaying, height, collapsed, drawGrid]);

  return (
    <div className="border-t bg-card shrink-0">
      {/* Label */}
      <div className="px-3 py-1 flex items-center">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand analyzer" : "Collapse analyzer"}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 ease-in-out",
                collapsed && "-rotate-90",
              )}
            />
          </button>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Analyzer
          </span>
        </div>
      </div>
      {/* Collapsible content with animated height */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          {/* Resize handle */}
          <div
            className="h-1.5 shrink-0 bg-border hover:bg-primary/20 transition-colors cursor-row-resize active:bg-primary/40"
            onPointerDown={onResizePointerDown}
          />
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
        </div>
      </div>
    </div>
  );
}
