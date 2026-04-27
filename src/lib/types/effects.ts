export interface ReverbEffect {
  type: "reverb";
  decay?: number;
  preDelay?: number;
  damping?: number;
  roomSize?: number;
  mix?: number;
}

export interface DelayEffect {
  type: "delay";
  time?: number;
  feedback?: number;
  feedbackFilter?: { type: string; frequency: number; Q?: number };
  mix?: number;
}

export interface ChorusEffect {
  type: "chorus";
  rate?: number;
  depth?: number;
  mix?: number;
}

export interface PhaserEffect {
  type: "phaser";
  rate?: number;
  depth?: number;
  stages?: number;
  feedback?: number;
  mix?: number;
}

export interface FlangerEffect {
  type: "flanger";
  rate?: number;
  depth?: number;
  feedback?: number;
  mix?: number;
}

export interface TremoloEffect {
  type: "tremolo";
  rate?: number;
  depth?: number;
}

export interface VibratoEffect {
  type: "vibrato";
  rate?: number;
  depth?: number;
}

export interface BitcrusherEffect {
  type: "bitcrusher";
  bits?: number;
  sampleRateReduction?: number;
  mix?: number;
}

export interface CompressorEffect {
  type: "compressor";
  threshold?: number;
  knee?: number;
  ratio?: number;
  attack?: number;
  release?: number;
}

export interface EQEffect {
  type: "eq";
  bands?: Array<{ type: string; frequency: number; gain: number; Q?: number }>;
}

export interface DistortionEffect {
  type: "distortion";
  amount?: number;
  mix?: number;
}

export interface GainEffect {
  type: "gain";
  value?: number;
}

export interface PanEffect {
  type: "pan";
  value?: number;
}

export interface ConvolverEffect {
  type: "convolver";
  url?: string;
  mix?: number;
}

export type EffectBase = {
  bypassed?: boolean;
};

export type Effect =
  | (ReverbEffect & EffectBase)
  | (DelayEffect & EffectBase)
  | (ChorusEffect & EffectBase)
  | (PhaserEffect & EffectBase)
  | (FlangerEffect & EffectBase)
  | (TremoloEffect & EffectBase)
  | (VibratoEffect & EffectBase)
  | (BitcrusherEffect & EffectBase)
  | (CompressorEffect & EffectBase)
  | (EQEffect & EffectBase)
  | (DistortionEffect & EffectBase)
  | (GainEffect & EffectBase)
  | (PanEffect & EffectBase)
  | (ConvolverEffect & EffectBase);

export type EffectType = Effect["type"];
