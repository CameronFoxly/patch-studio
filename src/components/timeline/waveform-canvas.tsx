"use client";

import { useRef, useEffect } from "react";
import type { Layer, Envelope } from "@/lib/types";

interface Props {
  layer: Layer;
}

// Virtual sample rate for waveform generation
const VIRTUAL_SR = 8000;

function getEnvelopeAmplitude(envelope: Envelope | undefined, t: number, totalDuration: number): number {
  if (!envelope) return 1;
  const { attack = 0, decay, sustain = 0, release = 0 } = envelope;

  if (t < attack) {
    return attack > 0 ? t / attack : 1;
  }

  const afterAttack = t - attack;
  if (afterAttack < decay) {
    const decayProgress = afterAttack / decay;
    return 1 - (1 - sustain) * decayProgress;
  }

  const sustainEnd = totalDuration - release;
  if (t < sustainEnd) {
    return sustain;
  }

  if (release > 0) {
    const releaseProgress = (t - sustainEnd) / release;
    return sustain * (1 - Math.min(releaseProgress, 1));
  }

  return 0;
}

// Seeded PRNG for stable noise across redraws
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getSourceSample(source: Layer["source"], phase: number, rng: () => number): number {
  if (source.type === "noise") {
    return (rng() - 0.5) * 2;
  }
  if (source.type === "wavetable") {
    const harmonics = source.harmonics || [1];
    const y = harmonics.reduce((sum, amp, i) => sum + amp * Math.sin(phase * (i + 1)), 0);
    const maxH = Math.max(...harmonics.map(Math.abs), 1);
    return y / maxH;
  }
  switch (source.type) {
    case "sine": return Math.sin(phase);
    case "triangle": return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case "square": return Math.sin(phase) >= 0 ? 1 : -1;
    case "sawtooth": return 2 * ((phase / (2 * Math.PI)) % 1) - 1;
    default: return 0;
  }
}

// Generate a full sample buffer at VIRTUAL_SR
function generateBuffer(layer: Layer, totalDuration: number): Float32Array {
  const numSamples = Math.ceil(totalDuration * VIRTUAL_SR);
  const buffer = new Float32Array(numSamples);
  const rng = mulberry32(42);

  const freq = layer.source.type !== "noise" && "frequency" in layer.source
    ? (typeof layer.source.frequency === "number" ? layer.source.frequency : layer.source.frequency.start)
    : 440;
  const gain = layer.gain ?? 1;

  const hasDistortion = layer.effects?.some(e => e.type === "distortion");
  const tremoloEffect = layer.effects?.find(e => e.type === "tremolo");

  for (let i = 0; i < numSamples; i++) {
    const t = i / VIRTUAL_SR;
    const tNorm = t / totalDuration;
    const envAmp = getEnvelopeAmplitude(layer.envelope, t, totalDuration);
    const phase = tNorm * freq * totalDuration * 2 * Math.PI;

    let sample = getSourceSample(layer.source, phase, rng);
    sample *= envAmp * gain;

    if (hasDistortion) {
      sample = Math.max(-0.8, Math.min(0.8, sample * 1.5));
    }

    if (tremoloEffect && "rate" in tremoloEffect && "depth" in tremoloEffect) {
      const tRate = tremoloEffect.rate || 5;
      const tDepth = tremoloEffect.depth || 0.5;
      sample *= 1 - tDepth * 0.5 * (1 + Math.sin(t * tRate * 2 * Math.PI));
    }

    buffer[i] = sample;
  }

  return buffer;
}

const CORNER_RADIUS = 6;

function drawWaveform(canvas: HTMLCanvasElement, layer: Layer) {
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
    ? (env.attack || 0) + env.decay + (env.release || 0) + 0.5
    : 2;

  const buffer = generateBuffer(layer, totalDuration);
  const numSamples = buffer.length;

  ctx.clearRect(0, 0, w, h);

  // Clip to rounded rect
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, CORNER_RADIUS);
  ctx.clip();

  const computedColor = getComputedStyle(canvas).color;

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
  ctx.fillStyle = computedColor;
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
  ctx.strokeStyle = computedColor;
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

export function WaveformCanvas({ layer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawWaveform(canvas, layer);

    const resizeObserver = new ResizeObserver(() => {
      drawWaveform(canvas, layer);
    });
    resizeObserver.observe(canvas);

    // Redraw when theme changes (dark class toggled on <html>)
    const themeObserver = new MutationObserver(() => {
      drawWaveform(canvas, layer);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [layer]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full text-primary rounded-md"
      style={{ display: "block" }}
    />
  );
}
