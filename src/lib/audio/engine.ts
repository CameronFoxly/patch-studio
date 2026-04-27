import { defineSound, ensureReady } from "@web-kits/audio";
import type { Layer, Filter, LFO } from "@/lib/types";
import type { Effect } from "@/lib/types";

function stripBypassedEffects(effects: Effect[]): Effect[] {
  return effects
    .filter((e) => !e.bypassed)
    .map(({ bypassed: _, ...rest }) => rest as Effect);
}

function stripBypassedFilters(filter: Filter | Filter[] | undefined): Filter | Filter[] | undefined {
  if (!filter) return undefined;
  const filters = Array.isArray(filter) ? filter : [filter];
  const active = filters
    .filter((f) => !f.bypassed)
    .map(({ bypassed: _, ...rest }) => rest as Filter);
  if (active.length === 0) return undefined;
  return active.length === 1 ? active[0] : active;
}

function stripBypassedLFOs(lfo: LFO | LFO[] | undefined): LFO | LFO[] | undefined {
  if (!lfo) return undefined;
  const lfos = Array.isArray(lfo) ? lfo : [lfo];
  const active = lfos
    .filter((l) => !l.bypassed)
    .map(({ bypassed: _, ...rest }) => rest as LFO);
  if (active.length === 0) return undefined;
  return active.length === 1 ? active[0] : active;
}

// Convert a Layer to the @web-kits/audio format (strip internal fields and bypassed modules)
export function layerToSoundDef(layer: Layer) {
  const {
    id,
    name,
    muted,
    solo,
    showEnvelope,
    ...def
  } = layer;

  const result: Record<string, unknown> = { ...def };

  result.filter = stripBypassedFilters(def.filter);
  if (!result.filter) delete result.filter;

  result.lfo = stripBypassedLFOs(def.lfo);
  if (!result.lfo) delete result.lfo;

  if (result.effects) {
    const active = stripBypassedEffects(result.effects as Effect[]);
    result.effects = active.length > 0 ? active : undefined;
    if (!result.effects) delete result.effects;
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
    ? stripBypassedEffects(globalEffects)
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
