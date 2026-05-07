import type { Layer, Envelope } from "@/lib/types";

/** Default virtual sample rate for waveform display (low-res, fast). */
export const WAVEFORM_SR = 8000;

/** High-fidelity sample rate for FFT analysis (matches Web Audio default). */
export const ANALYSIS_SR = 44_100;

export function getEnvelopeAmplitude(
  envelope: Envelope | undefined,
  t: number,
): number {
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

  // Release starts immediately after decay (matches @web-kits/audio behavior)
  const releaseStart = attack + decay;
  if (release > 0 && t < releaseStart + release) {
    const releaseProgress = (t - releaseStart) / release;
    return sustain * (1 - Math.min(releaseProgress, 1));
  }

  return 0;
}

/** Seeded PRNG for stable noise across redraws. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSourceSample(
  source: Layer["source"],
  phase: number,
  rng: () => number,
): number {
  if (source.type === "noise") {
    return (rng() - 0.5) * 2;
  }
  if (source.type === "wavetable") {
    const harmonics = source.harmonics || [1];
    const y = harmonics.reduce(
      (sum, amp, i) => sum + amp * Math.sin(phase * (i + 1)),
      0,
    );
    const maxH = Math.max(...harmonics.map(Math.abs), 1);
    return y / maxH;
  }
  switch (source.type) {
    case "sine":
      return Math.sin(phase);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case "square":
      return Math.sin(phase) >= 0 ? 1 : -1;
    case "sawtooth":
      return 2 * ((phase / (2 * Math.PI)) % 1) - 1;
    default:
      return 0;
  }
}

/**
 * Generate a full sample buffer for a single layer.
 * @param sampleRate - samples per second (default WAVEFORM_SR for display, ANALYSIS_SR for FFT)
 */
export function generateBuffer(
  layer: Layer,
  totalDuration: number,
  sampleRate: number = WAVEFORM_SR,
): Float32Array {
  const numSamples = Math.ceil(totalDuration * sampleRate);
  const buffer = new Float32Array(numSamples);
  const rng = mulberry32(42);

  const freq =
    layer.source.type !== "noise" && "frequency" in layer.source
      ? typeof layer.source.frequency === "number"
        ? layer.source.frequency
        : layer.source.frequency.start
      : 440;
  const gain = layer.gain ?? 1;

  const hasDistortion = layer.effects?.some((e) => e.type === "distortion");
  const tremoloEffect = layer.effects?.find((e) => e.type === "tremolo");

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const tNorm = t / totalDuration;
    const envAmp = getEnvelopeAmplitude(layer.envelope, t);
    const phase = tNorm * freq * totalDuration * 2 * Math.PI;

    let sample = getSourceSample(layer.source, phase, rng);
    sample *= envAmp * gain;

    if (hasDistortion) {
      sample = Math.max(-0.8, Math.min(0.8, sample * 1.5));
    }

    if (
      tremoloEffect &&
      "rate" in tremoloEffect &&
      "depth" in tremoloEffect
    ) {
      const tRate = tremoloEffect.rate || 5;
      const tDepth = tremoloEffect.depth || 0.5;
      sample *= 1 - tDepth * 0.5 * (1 + Math.sin(t * tRate * 2 * Math.PI));
    }

    buffer[i] = sample;
  }

  return buffer;
}
