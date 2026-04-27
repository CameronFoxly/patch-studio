import type { Layer, Filter, LFO } from "@/lib/types";
import type { Effect } from "@/lib/types";
import type { SoundPatch, SoundDefinition } from "@/lib/types";

function stripBypassed<T extends { bypassed?: boolean }>(items: T[]): T[] {
  return items.map(({ bypassed: _, ...rest }) => rest as T);
}

// Export: Convert store layers to a patch JSON object
export function exportPatch(
  name: string,
  layers: Layer[],
  globalEffects?: Effect[],
): SoundPatch {
  const definition: SoundDefinition = {};

  function cleanLayer(layer: Layer) {
    const {
      id,
      name: _layerName,
      muted,
      solo,
      showEnvelope,
      ...rest
    } = layer;
    if (rest.filter) {
      const filters = Array.isArray(rest.filter) ? rest.filter : [rest.filter];
      const cleaned = stripBypassed(filters);
      rest.filter = cleaned.length === 1 ? cleaned[0] : cleaned.length > 0 ? cleaned : undefined;
    }
    if (rest.lfo) {
      const lfos = Array.isArray(rest.lfo) ? rest.lfo : [rest.lfo];
      const cleaned = stripBypassed(lfos);
      rest.lfo = cleaned.length === 1 ? cleaned[0] : cleaned.length > 0 ? cleaned : undefined;
    }
    if (rest.effects) {
      rest.effects = stripBypassed(rest.effects);
    }
    return rest;
  }

  if (layers.length === 1) {
    Object.assign(definition, cleanLayer(layers[0]));
  } else if (layers.length > 1) {
    definition.layers = layers.map(
      (l) => cleanLayer(l) as Layer,
    );
  }

  if (globalEffects && globalEffects.length > 0) {
    definition.effects = stripBypassed(globalEffects);
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
