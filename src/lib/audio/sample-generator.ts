import type { Layer, Envelope, Filter, BiquadFilter, BiquadFilterType } from "@/lib/types";
import type { Effect } from "@/lib/types/effects";

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

// ── Biquad filter state machine (Audio EQ Cookbook) ──────────────────

interface BiquadState {
  x1: number; x2: number; y1: number; y2: number;
  b0: number; b1: number; b2: number; a1: number; a2: number;
}

function createBiquadState(
  filter: BiquadFilter,
  sampleRate: number,
): BiquadState {
  const f0 = filter.frequency;
  const Q = filter.resonance ?? 1;
  const dbGain = filter.gain ?? 0;
  const w0 = (2 * Math.PI * f0) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Q);
  const A = Math.pow(10, dbGain / 40);

  let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

  switch (filter.type) {
    case "lowpass":
      b0 = (1 - cosW0) / 2;
      b1 = 1 - cosW0;
      b2 = (1 - cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case "highpass":
      b0 = (1 + cosW0) / 2;
      b1 = -(1 + cosW0);
      b2 = (1 + cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case "bandpass":
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case "notch":
      b0 = 1;
      b1 = -2 * cosW0;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case "allpass":
      b0 = 1 - alpha;
      b1 = -2 * cosW0;
      b2 = 1 + alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case "peaking": {
      b0 = 1 + alpha * A;
      b1 = -2 * cosW0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosW0;
      a2 = 1 - alpha / A;
      break;
    }
    case "lowshelf": {
      const sq = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) - (A - 1) * cosW0 + sq);
      b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
      b2 = A * ((A + 1) - (A - 1) * cosW0 - sq);
      a0 = (A + 1) + (A - 1) * cosW0 + sq;
      a1 = -2 * ((A - 1) + (A + 1) * cosW0);
      a2 = (A + 1) + (A - 1) * cosW0 - sq;
      break;
    }
    case "highshelf": {
      const sq = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) + (A - 1) * cosW0 + sq);
      b1 = -2 * A * ((A - 1) + (A + 1) * cosW0);
      b2 = A * ((A + 1) + (A - 1) * cosW0 - sq);
      a0 = (A + 1) - (A - 1) * cosW0 + sq;
      a1 = 2 * ((A - 1) - (A + 1) * cosW0);
      a2 = (A + 1) - (A - 1) * cosW0 - sq;
      break;
    }
  }

  // Normalise coefficients
  return {
    x1: 0, x2: 0, y1: 0, y2: 0,
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

function processBiquad(state: BiquadState, input: number): number {
  const out =
    state.b0 * input +
    state.b1 * state.x1 +
    state.b2 * state.x2 -
    state.a1 * state.y1 -
    state.a2 * state.y2;
  state.x2 = state.x1;
  state.x1 = input;
  state.y2 = state.y1;
  state.y1 = out;
  return out;
}

function getActiveFilters(filter: Filter | Filter[] | undefined): BiquadFilter[] {
  if (!filter) return [];
  const filters = Array.isArray(filter) ? filter : [filter];
  return filters.filter(
    (f): f is BiquadFilter => f.type !== "iir" && !f.bypassed,
  );
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

  // Compute effective frequency including detune
  let freq: number;
  if (layer.source.type !== "noise" && "frequency" in layer.source) {
    const baseFreq =
      typeof layer.source.frequency === "number"
        ? layer.source.frequency
        : layer.source.frequency.start;
    const detune =
      layer.source.type !== "wavetable" && "detune" in layer.source
        ? (layer.source.detune ?? 0)
        : 0;
    freq = baseFreq * Math.pow(2, detune / 1200);
  } else {
    freq = 440;
  }

  const gain = layer.gain ?? 1;

  // Initialize biquad filter chain
  const activeFilters = getActiveFilters(layer.filter);
  const filterStates = activeFilters.map((f) =>
    createBiquadState(f, sampleRate),
  );

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const tNorm = t / totalDuration;
    const envAmp = getEnvelopeAmplitude(layer.envelope, t);
    const phase = tNorm * freq * totalDuration * 2 * Math.PI;

    let sample = getSourceSample(layer.source, phase, rng);
    sample *= envAmp * gain;

    // Apply biquad filter chain
    for (const state of filterStates) {
      sample = processBiquad(state, sample);
    }

    buffer[i] = sample;
  }

  // Apply per-layer effects (distortion, EQ, bitcrusher, compressor, etc.)
  if (layer.effects && layer.effects.length > 0) {
    applyEffectsToBuffer(buffer, layer.effects, sampleRate);
  }

  return buffer;
}

// ── Effects processing (shared by per-layer and master bus) ─────────

/**
 * Apply an array of effects to a buffer in-place.
 * Supports: EQ, distortion, bitcrusher, compressor, gain, tremolo.
 */
function applyEffectsToBuffer(
  buffer: Float32Array,
  effects: Effect[],
  sampleRate: number = ANALYSIS_SR,
): void {
  for (const effect of effects) {
    if ("bypassed" in effect && effect.bypassed) continue;

    switch (effect.type) {
      case "eq": {
        const bands = effect.bands;
        if (!bands || bands.length === 0) break;
        for (const band of bands) {
          const bq = createBiquadState(
            {
              type: band.type as BiquadFilterType,
              frequency: band.frequency,
              gain: band.gain,
              resonance: band.Q ?? 1,
            },
            sampleRate,
          );
          for (let i = 0; i < buffer.length; i++) {
            buffer[i] = processBiquad(bq, buffer[i]);
          }
        }
        break;
      }
      case "distortion": {
        const amount = effect.amount ?? 50;
        const k = (2 * amount) / (100 - amount + 1);
        for (let i = 0; i < buffer.length; i++) {
          const x = buffer[i];
          buffer[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
        }
        break;
      }
      case "bitcrusher": {
        const bits = effect.bits ?? 8;
        const srReduction = effect.sampleRateReduction ?? 1;
        const levels = Math.pow(2, bits);
        let held = 0;
        for (let i = 0; i < buffer.length; i++) {
          if (i % srReduction === 0) {
            held = Math.round(buffer[i] * levels) / levels;
          }
          buffer[i] = held;
        }
        break;
      }
      case "compressor": {
        const threshold = effect.threshold ?? -24;
        const ratio = effect.ratio ?? 4;
        const threshLin = Math.pow(10, threshold / 20);
        for (let i = 0; i < buffer.length; i++) {
          const abs = Math.abs(buffer[i]);
          if (abs > threshLin) {
            const over = abs - threshLin;
            const compressed = threshLin + over / ratio;
            buffer[i] = buffer[i] > 0 ? compressed : -compressed;
          }
        }
        break;
      }
      case "gain": {
        const val = effect.value ?? 1;
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] *= val;
        }
        break;
      }
      case "tremolo": {
        const rate = effect.rate ?? 5;
        const depth = effect.depth ?? 0.5;
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          buffer[i] *= 1 - depth * 0.5 * (1 + Math.sin(t * rate * 2 * Math.PI));
        }
        break;
      }
      // Effects like reverb, delay, chorus require delay lines /
      // convolution that are hard to model on CPU cheaply — skip for now.
      default:
        break;
    }
  }
}

/** Public alias for applying master/global effects. */
export { applyEffectsToBuffer as applyMasterEffects };
