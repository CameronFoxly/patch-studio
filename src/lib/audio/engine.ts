import { defineSound, ensureReady } from "@web-kits/audio";
import type { Layer } from "@/lib/types";
import type { Effect } from "@/lib/types";

// Convert a Layer to the @web-kits/audio format (strip internal fields like id, name, muted, solo)
export function layerToSoundDef(layer: Layer) {
  const { id, name, muted, solo, ...def } = layer;
  return def;
}

// Convert layers array to a multi-layer sound definition
export function layersToSoundDefinition(
  layers: Layer[],
  globalEffects?: Effect[],
) {
  const activeLayers = layers.filter((l) => {
    if (l.muted) return false;
    const anySolo = layers.some((x) => x.solo);
    if (anySolo && !l.solo) return false;
    return true;
  });
  if (activeLayers.length === 0) return null;

  if (activeLayers.length === 1) {
    const def = layerToSoundDef(activeLayers[0]);
    return globalEffects
      ? { ...def, effects: [...(def.effects || []), ...globalEffects] }
      : def;
  }

  return {
    layers: activeLayers.map(layerToSoundDef),
    ...(globalEffects && globalEffects.length > 0
      ? { effects: globalEffects }
      : {}),
  };
}

// Play the current sound
export async function playSound(layers: Layer[], globalEffects?: Effect[]) {
  await ensureReady();
  const definition = layersToSoundDefinition(layers, globalEffects);
  if (!definition) return null;
  const play = defineSound(definition as any);
  return play();
}
