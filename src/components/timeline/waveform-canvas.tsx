"use client";

import { useRef, useEffect } from "react";
import type { Layer } from "@/lib/types";
import { ENVELOPE_TAIL } from "@/lib/audio/constants";
import { generateBuffer } from "@/lib/audio/sample-generator";

interface Props {
  layer: Layer;
  color?: string;
}

const CORNER_RADIUS = 4;

function drawWaveform(canvas: HTMLCanvasElement, layer: Layer, color?: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.scale(dpr, dpr);

  const mid = h / 2;
  const baseAmp = h * 0.4;

  const env = layer.envelope;
  const totalDuration = env
    ? (env.attack || 0) + env.decay + (env.release || 0) + ENVELOPE_TAIL
    : 2;

  const buffer = generateBuffer(layer, totalDuration);
  const numSamples = buffer.length;

  ctx.clearRect(0, 0, w, h);

  // Clip to rounded rect
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, CORNER_RADIUS);
  ctx.clip();

  const drawColor = color || getComputedStyle(canvas).color;

  // Min/max decimation: for each pixel column, find the min and max sample
  const minArr = new Float32Array(Math.ceil(w));
  const maxArr = new Float32Array(Math.ceil(w));

  for (let px = 0; px < w; px++) {
    const sStart = Math.floor((px / w) * numSamples);
    const sEnd = Math.max(sStart + 1, Math.floor(((px + 1) / w) * numSamples));

    let lo = Infinity;
    let hi = -Infinity;
    for (let s = sStart; s < sEnd && s < numSamples; s++) {
      const v = buffer[s];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (lo === Infinity) { lo = 0; hi = 0; }
    minArr[px] = lo;
    maxArr[px] = hi;
  }

  // Draw filled area (min to max envelope)
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = drawColor;
  ctx.beginPath();
  ctx.moveTo(0, mid - maxArr[0] * baseAmp);
  for (let px = 1; px < w; px++) {
    ctx.lineTo(px, mid - maxArr[px] * baseAmp);
  }
  for (let px = Math.ceil(w) - 1; px >= 0; px--) {
    ctx.lineTo(px, mid - minArr[px] * baseAmp);
  }
  ctx.closePath();
  ctx.fill();

  // Draw waveform outline (top edge = max, bottom edge = min)
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Top edge
  ctx.beginPath();
  ctx.moveTo(0, mid - maxArr[0] * baseAmp);
  for (let px = 1; px < w; px++) {
    ctx.lineTo(px, mid - maxArr[px] * baseAmp);
  }
  ctx.stroke();

  // Bottom edge
  ctx.beginPath();
  ctx.moveTo(0, mid - minArr[0] * baseAmp);
  for (let px = 1; px < w; px++) {
    ctx.lineTo(px, mid - minArr[px] * baseAmp);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
}

export function WaveformCanvas({ layer, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawWaveform(canvas, layer, color);

    const resizeObserver = new ResizeObserver(() => {
      drawWaveform(canvas, layer, color);
    });
    resizeObserver.observe(canvas);

    // Redraw when theme changes (dark class toggled on <html>)
    const themeObserver = new MutationObserver(() => {
      drawWaveform(canvas, layer, color);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [layer, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full text-primary rounded-sm"
      style={{ display: "block" }}
    />
  );
}
