import type { SoundDefinition } from "./patch";

export interface SequenceStep {
  id: string;
  name: string;
  sound: SoundDefinition;
  /** Which layer to use as the sound source (null = custom/inline) */
  layerId?: string | null;
  /** Relative delay after the previous step (seconds) */
  wait?: number;
  /** Per-step volume override (0–1) */
  volume?: number;
}

export interface SequenceOptions {
  bpm?: number;
  loop?: boolean;
}

export interface Sequence {
  steps: SequenceStep[];
  options: SequenceOptions;
}
