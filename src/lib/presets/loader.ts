import type { Layer, Source, Filter, Envelope, LFO, Effect } from "@/lib/types";

// Raw sound definition from the @web-kits/audio JSON patches
interface RawSoundLayer {
  source: Source;
  filter?: Filter | Filter[];
  envelope?: Envelope;
  gain?: number;
  pan?: number;
  delay?: number;
  lfo?: LFO | LFO[];
  effects?: Effect[];
}

interface RawSoundDefinition {
  source?: Source;
  filter?: Filter | Filter[];
  envelope?: Envelope;
  gain?: number;
  pan?: number;
  delay?: number;
  lfo?: LFO | LFO[];
  effects?: Effect[];
  layers?: RawSoundLayer[];
}

interface RawPatchFile {
  $schema?: string;
  name: string;
  author: string;
  version: string;
  description: string;
  sounds: Record<string, RawSoundDefinition>;
}

// Cache for fetched patch files
const patchCache = new Map<string, RawPatchFile>();

export async function fetchPatchFile(collectionId: string): Promise<RawPatchFile> {
  const cached = patchCache.get(collectionId);
  if (cached) return cached;

  const res = await fetch(`/presets/${collectionId}.json`);
  if (!res.ok) throw new Error(`Failed to fetch preset collection: ${collectionId}`);
  const data: RawPatchFile = await res.json();
  patchCache.set(collectionId, data);
  return data;
}

export async function getSoundNames(collectionId: string): Promise<string[]> {
  const patch = await fetchPatchFile(collectionId);
  return Object.keys(patch.sounds);
}

function formatSoundName(key: string): string {
  return key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function rawLayerToLayer(raw: RawSoundLayer, index: number, soundName: string): Layer {
  return {
    id: crypto.randomUUID(),
    name: index === 0 ? soundName : `${soundName} ${index + 1}`,
    source: raw.source,
    filter: raw.filter,
    envelope: raw.envelope,
    gain: raw.gain,
    pan: raw.pan,
    delay: raw.delay,
    lfo: raw.lfo,
    effects: raw.effects,
  };
}

export async function loadPresetSound(
  collectionId: string,
  soundKey: string,
): Promise<Layer[] | null> {
  const patch = await fetchPatchFile(collectionId);
  const sound = patch.sounds[soundKey];
  if (!sound) return null;

  const displayName = formatSoundName(soundKey);

  if (sound.layers) {
    return sound.layers.map((l, i) => rawLayerToLayer(l, i, displayName));
  }

  // Single-layer sound (source at top level)
  if (sound.source) {
    return [
      rawLayerToLayer(
        {
          source: sound.source,
          filter: sound.filter,
          envelope: sound.envelope,
          gain: sound.gain,
          pan: sound.pan,
          delay: sound.delay,
          lfo: sound.lfo,
          effects: sound.effects,
        },
        0,
        displayName,
      ),
    ];
  }

  return null;
}

export function getSoundNamesSync(collectionId: string): string[] | null {
  const cached = patchCache.get(collectionId);
  if (!cached) return null;
  return Object.keys(cached.sounds);
}
