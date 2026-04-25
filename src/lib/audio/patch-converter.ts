import type { Layer } from "@/lib/types";
import type { Effect } from "@/lib/types";
import type { SoundPatch, SoundDefinition } from "@/lib/types";

// Export: Convert store layers to a patch JSON object
export function exportPatch(
  name: string,
  layers: Layer[],
  globalEffects?: Effect[],
): SoundPatch {
  const definition: SoundDefinition = {};

  if (layers.length === 1) {
    const { id, name: _layerName, muted, solo, ...rest } = layers[0];
    Object.assign(definition, rest);
  } else if (layers.length > 1) {
    definition.layers = layers.map(
      ({ id, name: _layerName, muted, solo, ...rest }) => rest as Layer,
    );
  }

  if (globalEffects && globalEffects.length > 0) {
    definition.effects = globalEffects;
  }

  return {
    $schema: "https://unpkg.com/@web-kits/audio/patch.schema.json",
    name,
    sounds: { main: definition },
  };
}

// Import: Convert a patch JSON into layers for the store
export function importPatch(patch: SoundPatch): {
  layers: Layer[];
  globalEffects: Effect[];
} {
  const layers: Layer[] = [];
  const globalEffects: Effect[] = [];

  const soundName = Object.keys(patch.sounds)[0];
  if (!soundName) return { layers, globalEffects };

  const def = patch.sounds[soundName];

  if (def.layers && Array.isArray(def.layers)) {
    def.layers.forEach((layerDef, i) => {
      const { id: _id, name: _name, ...rest } = layerDef;
      layers.push({
        ...rest,
        id: crypto.randomUUID(),
        name: `Layer ${i + 1}`,
      });
    });
  } else if (def.source) {
    layers.push({
      id: crypto.randomUUID(),
      name: soundName,
      source: def.source,
      filter: def.filter,
      envelope: def.envelope,
      gain: def.gain,
      pan: def.pan,
      panner: def.panner,
      lfo: def.lfo,
      effects: def.effects,
    });
  }

  if (def.effects) {
    globalEffects.push(...def.effects);
  }

  return { layers, globalEffects };
}

// Download patch as JSON file
export function downloadPatch(patch: SoundPatch) {
  const json = JSON.stringify(patch, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${patch.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
