import type { Effect } from "./effects";

// Source types
export type OscillatorType = "sine" | "triangle" | "square" | "sawtooth";
export type NoiseColor = "white" | "pink" | "brown";

export interface FrequencySweep {
  start: number;
  end: number;
}

export interface FMSynthesis {
  ratio: number;
  depth: number;
}

export interface OscillatorSource {
  type: OscillatorType;
  frequency: number | FrequencySweep;
  detune?: number;
  fm?: FMSynthesis;
}

export interface NoiseSource {
  type: "noise";
  color?: NoiseColor;
}

export interface WavetableSource {
  type: "wavetable";
  harmonics: number[];
  frequency: number;
}

export type Source = OscillatorSource | NoiseSource | WavetableSource;

// Filter types
export type BiquadFilterType =
  | "lowpass"
  | "highpass"
  | "bandpass"
  | "notch"
  | "allpass"
  | "peaking"
  | "lowshelf"
  | "highshelf";

export interface FilterEnvelope {
  attack: number;
  peak: number;
  decay: number;
}

export interface BiquadFilter {
  type: BiquadFilterType;
  frequency: number;
  resonance?: number;
  gain?: number;
  envelope?: FilterEnvelope;
  bypassed?: boolean;
}

export interface IIRFilter {
  type: "iir";
  feedforward: number[];
  feedback: number[];
  bypassed?: boolean;
}

export type Filter = BiquadFilter | IIRFilter;

// Envelope (ADSR)
export interface Envelope {
  attack?: number;
  decay: number;
  sustain?: number;
  release?: number;
}

// LFO
export type LFOTarget =
  | "frequency"
  | "detune"
  | "gain"
  | "pan"
  | "filter.frequency"
  | "filter.detune"
  | "filter.Q"
  | "filter.gain"
  | "playbackRate";

export interface LFO {
  type: OscillatorType;
  frequency: number;
  depth: number;
  target: LFOTarget;
  bypassed?: boolean;
}

// Spatial / 3D Panner
export type PanningModel = "equalpower" | "HRTF";
export type DistanceModel = "linear" | "inverse" | "exponential";

export interface Panner3D {
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  orientationX?: number;
  orientationY?: number;
  orientationZ?: number;
  panningModel?: PanningModel;
  distanceModel?: DistanceModel;
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
}

// Layer
export interface Layer {
  id: string;
  name: string;
  color?: string;
  source: Source;
  filter?: Filter | Filter[];
  envelope?: Envelope;
  gain?: number;
  pan?: number;
  panner?: Panner3D;
  delay?: number;
  lfo?: LFO | LFO[];
  effects?: Effect[];
  muted?: boolean;
  solo?: boolean;
  showEnvelope?: boolean;
}
