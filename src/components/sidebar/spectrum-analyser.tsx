"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useSpectrumAnalyser } from "@/hooks/use-spectrum-analyser";
import { useStore } from "@/lib/store";

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

/** Map a frequency (Hz) to a normalised 0–1 position (log scale). */
function freqToX(freq: number): number {
  return (
    (Math.log(freq / MIN_FREQ)) /
    (Math.log(MAX_FREQ / MIN_FREQ))
  );
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
        // Dragging up increases height
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

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(
    (frequencyData: Uint8Array, binCount: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Compute frequency per bin
      const binFreq = SAMPLE_RATE / (binCount * 2); // fftSize = binCount * 2

      // Axis area
      const axisBottom = 16 * dpr;
      const plotH = h - axisBottom;
      const plotW = w;

      // Draw frequency labels
      ctx.save();
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("color");
      ctx.font = `${9 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.5;

      for (let i = 0; i < FREQ_VALUES.length; i++) {
        const x = freqToX(FREQ_VALUES[i]) * plotW;
        ctx.fillText(String(FREQ_LABELS[i]), x, h - 2 * dpr);
      }
      ctx.restore();

      // Draw bars — aggregate bins into pixel columns using log-frequency mapping
      const barColor = getComputedStyle(canvas).getPropertyValue("color");

      ctx.save();
      ctx.fillStyle = barColor;
      ctx.globalAlpha = 0.7;

      // For each pixel column, find the frequency range it covers, then average the bins
      const cols = Math.floor(plotW / dpr);
      const barW = Math.max(1, plotW / cols);

      for (let col = 0; col < cols; col++) {
        // Frequency range for this column (log scale)
        const fLow = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, col / cols);
        const fHigh = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (col + 1) / cols);

        // Map to bin indices
        const binLow = Math.max(0, Math.floor(fLow / binFreq));
        const binHigh = Math.min(binCount - 1, Math.ceil(fHigh / binFreq));

        if (binLow > binCount - 1) continue;

        // Max value in the bin range (gives sharper peaks than averaging)
        let maxVal = 0;
        for (let b = binLow; b <= binHigh; b++) {
          if (frequencyData[b] > maxVal) maxVal = frequencyData[b];
        }

        const normVal = maxVal / 255;
        const barH = normVal * plotH;

        const x = col * barW;
        ctx.fillRect(x, plotH - barH, barW - (dpr > 1 ? 0 : 0.5), barH);
      }

      ctx.restore();
    },
    [],
  );

  useSpectrumAnalyser(draw, isPlaying);

  // Clear canvas when playback stops
  useEffect(() => {
    if (!isPlaying) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Fade out effect — draw frequency labels only
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isPlaying]);

  return (
    <div className="border-t bg-card flex flex-col">
      {/* Resize handle */}
      <div
        className="h-1.5 shrink-0 bg-border hover:bg-primary/20 transition-colors cursor-row-resize active:bg-primary/40"
        onPointerDown={onResizePointerDown}
      />
      {/* Label */}
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Spectrum
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          20 Hz — 20 kHz
        </span>
      </div>
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full text-foreground"
        />
      </div>
    </div>
  );
}
