import type { SoundDefinition } from "./patch";

export interface SequenceStep {
  id: string;
  name: string;
  sound: SoundDefinition;
  duration?: number;
}

export interface SequenceOptions {
  bpm?: number;
  loop?: boolean;
}

export interface Sequence {
  steps: SequenceStep[];
  options: SequenceOptions;
}
