import type { Layer } from "./layer";
import type { Effect } from "./effects";

export interface SoundDefinition {
  layers?: Layer[];
  source?: Layer["source"];
  filter?: Layer["filter"];
  envelope?: Layer["envelope"];
  gain?: Layer["gain"];
  pan?: Layer["pan"];
  panner?: Layer["panner"];
  lfo?: Layer["lfo"];
  effects?: Effect[];
}

export interface SoundPatch {
  $schema?: string;
  name: string;
  sounds: Record<string, SoundDefinition>;
}
