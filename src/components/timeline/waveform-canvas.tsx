"use client";

import { useRef, useEffect } from "react";
import type { Source } from "@/lib/types";

interface Props {
  source: Source;
}

export function WaveformCanvas({ source }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const mid = h / 2;
    const amp = h * 0.35;

    ctx.clearRect(0, 0, w, h);

    // Use CSS currentColor via computed style
    const computedColor = getComputedStyle(canvas).color;
    ctx.strokeStyle = computedColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const t = (x / w) * Math.PI * 8; // ~4 cycles visible
      let y = 0;

      if (source.type === "noise") {
        y = (Math.random() - 0.5) * 2;
      } else if (source.type === "wavetable") {
        const harmonics = source.harmonics || [1];
        y = harmonics.reduce(
          (sum, harmAmp, i) => sum + harmAmp * Math.sin(t * (i + 1)),
          0,
        );
        const maxH = Math.max(...harmonics.map(Math.abs), 1);
        y /= maxH;
      } else {
        switch (source.type) {
          case "sine":
            y = Math.sin(t);
            break;
          case "triangle":
            y = (2 / Math.PI) * Math.asin(Math.sin(t));
            break;
          case "square":
            y = Math.sin(t) >= 0 ? 1 : -1;
            break;
          case "sawtooth":
            y = 2 * ((t / (2 * Math.PI)) % 1) - 1;
            break;
        }
      }

      const py = mid - y * amp;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }

    ctx.stroke();
  }, [source]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full text-primary"
      style={{ display: "block" }}
    />
  );
}
