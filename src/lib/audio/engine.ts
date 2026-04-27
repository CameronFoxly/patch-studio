import { defineSound, ensureReady } from "@web-kits/audio";
import type { Layer } from "@/lib/types";
import type { Effect } from "@/lib/types";

function stripBypassed(effects: Effect[]): Effect[] {
  return effects
    .filter((e) => !e.bypassed)
    .map(({ bypassed: _, ...rest }) => rest as Effect);
}

// Convert a Layer to the @web-kits/audio format (strip internal fields like id, name, muted, solo)
export function layerToSoundDef(layer: Layer) {
  const {
    id,
    name,
    muted,
    solo,
    showEnvelope,
    filterBypassed,
    lfoBypassed,
    effectsBypassed,
    ...def
  } = layer;

  const result: Record<string, unknown> = { ...def };

  if (filterBypassed) {
    delete result.filter;
  }
  if (lfoBypassed) {
    delete result.lfo;
  }
  if (result.effects) {
    result.effects = stripBypassed(result.effects as Effect[]);
    if ((result.effects as Effect[]).length === 0) delete result.effects;
  }

  return result;
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

  const activeGlobalEffects = globalEffects
    ? stripBypassed(globalEffects)
    : undefined;

  if (activeLayers.length === 1) {
    const def = layerToSoundDef(activeLayers[0]);
    return activeGlobalEffects && activeGlobalEffects.length > 0
      ? { ...def, effects: [...((def.effects as Effect[]) || []), ...activeGlobalEffects] }
      : def;
  }

  return {
    layers: activeLayers.map(layerToSoundDef),
    ...(activeGlobalEffects && activeGlobalEffects.length > 0
      ? { effects: activeGlobalEffects }
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
