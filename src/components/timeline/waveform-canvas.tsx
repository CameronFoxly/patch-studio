"use client";

import { useRef, useEffect } from "react";
import type { Layer, Envelope } from "@/lib/types";

interface Props {
  layer: Layer;
}

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

function getSourceSample(source: Layer["source"], phase: number): number {
  if (source.type === "noise") {
    return (Math.random() - 0.5) * 2;
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

function computeSample(layer: Layer, tNorm: number, totalDuration: number, cyclesVisible: number): number {
  const time = tNorm * totalDuration;
  const envAmp = getEnvelopeAmplitude(layer.envelope, time, totalDuration);
  const phase = tNorm * cyclesVisible * 2 * Math.PI;
  const gain = layer.gain ?? 1;

  let sample = getSourceSample(layer.source, phase);
  sample *= envAmp * gain;

  // Distortion hint: clip the signal
  if (layer.effects?.some(e => e.type === "distortion")) {
    sample = Math.max(-0.8, Math.min(0.8, sample * 1.5));
  }

  // Tremolo hint: amplitude modulation
  const tremoloEffect = layer.effects?.find(e => e.type === "tremolo");
  if (tremoloEffect && "rate" in tremoloEffect && "depth" in tremoloEffect) {
    const tRate = tremoloEffect.rate || 5;
    const tDepth = tremoloEffect.depth || 0.5;
    sample *= 1 - tDepth * 0.5 * (1 + Math.sin(time * tRate * 2 * Math.PI));
  }

  return sample;
}

export function WaveformCanvas({ layer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const mid = h / 2;
    const baseAmp = h * 0.4;

    const env = layer.envelope;
    const totalDuration = env
      ? (env.attack || 0) + env.decay + (env.release || 0) + 0.5
      : 2;

    const freq = layer.source.type !== "noise" && "frequency" in layer.source
      ? (typeof layer.source.frequency === "number" ? layer.source.frequency : layer.source.frequency.start)
      : 440;
    const cyclesVisible = Math.min(freq * totalDuration, 200);

    ctx.clearRect(0, 0, w, h);

    const computedColor = getComputedStyle(canvas).color;
    ctx.strokeStyle = computedColor;
    ctx.lineWidth = 1.5;

    // Draw filled area
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = computedColor;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    for (let x = 0; x < w; x++) {
      const sample = computeSample(layer, x / w, totalDuration, cyclesVisible);
      ctx.lineTo(x, mid - sample * baseAmp);
    }
    ctx.lineTo(w, mid);
    ctx.closePath();
    ctx.fill();

    // Draw waveform line
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const sample = computeSample(layer, x / w, totalDuration, cyclesVisible);
      const py = mid - sample * baseAmp;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [layer]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full text-primary"
      style={{ display: "block" }}
    />
  );
}
