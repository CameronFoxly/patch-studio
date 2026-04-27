import type { StateCreator } from "zustand";
import type {
  Layer,
  Source,
  Filter,
  Envelope,
  LFO,
  Panner3D,
  Effect,
} from "@/lib/types";
import type { StoreState } from "../index";

export interface LayersSlice {
  layers: Layer[];
  globalEffects: Effect[];

  addLayer: (source?: Source) => string;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  updateLayerSource: (id: string, source: Source) => void;
  updateLayerFilter: (
    id: string,
    filter: Filter | Filter[] | undefined,
  ) => void;
  updateLayerEnvelope: (id: string, envelope: Envelope | undefined) => void;
  updateLayerGain: (id: string, gain: number) => void;
  updateLayerPan: (id: string, pan: number) => void;
  updateLayerDelay: (id: string, delay: number) => void;
  updateLayerPanner: (id: string, panner: Panner3D | undefined) => void;
  updateLayerLFO: (id: string, lfo: LFO | LFO[] | undefined) => void;
  updateLayerEffects: (id: string, effects: Effect[]) => void;
  updateLayerName: (id: string, name: string) => void;
  toggleLayerMute: (id: string) => void;
  toggleLayerSolo: (id: string) => void;
  toggleLayerEnvelopeOverlay: (id: string) => void;
  toggleLayerFilterBypass: (id: string) => void;
  toggleLayerLFOBypass: (id: string) => void;
  toggleLayerEffectBypass: (id: string, index: number) => void;

  setLayers: (layers: Layer[]) => void;
  appendLayers: (layers: Layer[]) => void;
  clearLayers: () => void;

  setGlobalEffects: (effects: Effect[]) => void;
  addGlobalEffect: (effect: Effect) => void;
  updateGlobalEffect: (index: number, effect: Effect) => void;
  removeGlobalEffect: (index: number) => void;
  toggleGlobalEffectBypass: (index: number) => void;
}

const DEFAULT_SOURCE: Source = {
  type: "sine",
  frequency: 440,
};

function defaultLayer(layerNumber: number): Layer {
  return {
    id: crypto.randomUUID(),
    name: `Layer ${layerNumber}`,
    source: { ...DEFAULT_SOURCE },
    envelope: { decay: 0.3 },
    gain: 0.8,
    pan: 0,
  };
}

function updateLayer(
  layers: Layer[],
  id: string,
  updater: (layer: Layer) => Layer,
): Layer[] {
  return layers.map((l) => (l.id === id ? updater(l) : l));
}

const INITIAL_LAYER = defaultLayer(1);
export const INITIAL_LAYER_ID = INITIAL_LAYER.id;

export const createLayersSlice: StateCreator<
  StoreState,
  [],
  [],
  LayersSlice
> = (set, get) => ({
  layers: [INITIAL_LAYER],
  globalEffects: [],

  addLayer: (source) => {
    const layer = defaultLayer(get().layers.length + 1);
    if (source) layer.source = source;
    set({ layers: [...get().layers, layer] });
    return layer.id;
  },

  removeLayer: (id) => {
    set({ layers: get().layers.filter((l) => l.id !== id) });
  },

  duplicateLayer: (id) => {
    const original = get().layers.find((l) => l.id === id);
    if (!original) return;
    const copy: Layer = {
      ...structuredClone(original),
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
    };
    const idx = get().layers.findIndex((l) => l.id === id);
    const next = [...get().layers];
    next.splice(idx + 1, 0, copy);
    set({ layers: next });
  },

  reorderLayers: (fromIndex, toIndex) => {
    const next = [...get().layers];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    set({ layers: next });
  },

  updateLayerSource: (id, source) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, source })) });
  },

  updateLayerFilter: (id, filter) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, filter })) });
  },

  updateLayerEnvelope: (id, envelope) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({ ...l, envelope })),
    });
  },

  updateLayerGain: (id, gain) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, gain })) });
  },

  updateLayerPan: (id, pan) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, pan })) });
  },

  updateLayerDelay: (id, delay) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, delay })) });
  },

  updateLayerPanner: (id, panner) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, panner })) });
  },

  updateLayerLFO: (id, lfo) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, lfo })) });
  },

  updateLayerEffects: (id, effects) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, effects })) });
  },

  updateLayerName: (id, name) => {
    set({ layers: updateLayer(get().layers, id, (l) => ({ ...l, name })) });
  },

  toggleLayerMute: (id) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({
        ...l,
        muted: !l.muted,
      })),
    });
  },

  toggleLayerSolo: (id) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({
        ...l,
        solo: !l.solo,
      })),
    });
  },

  toggleLayerEnvelopeOverlay: (id) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({
        ...l,
        showEnvelope: !l.showEnvelope,
      })),
    });
  },

  toggleLayerFilterBypass: (id) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({
        ...l,
        filterBypassed: !l.filterBypassed,
      })),
    });
  },

  toggleLayerLFOBypass: (id) => {
    set({
      layers: updateLayer(get().layers, id, (l) => ({
        ...l,
        lfoBypassed: !l.lfoBypassed,
      })),
    });
  },

  toggleLayerEffectBypass: (id, index) => {
    set({
      layers: updateLayer(get().layers, id, (l) => {
        if (!l.effects) return l;
        const effects = l.effects.map((e, i) =>
          i === index ? { ...e, bypassed: !e.bypassed } : e,
        );
        return { ...l, effects };
      }),
    });
  },

  setLayers: (layers) => set({ layers }),
  appendLayers: (layers) => set({ layers: [...get().layers, ...layers] }),
  clearLayers: () => set({ layers: [] }),

  setGlobalEffects: (effects) => set({ globalEffects: effects }),
  addGlobalEffect: (effect) =>
    set({ globalEffects: [...get().globalEffects, effect] }),
  updateGlobalEffect: (index, effect) => {
    const next = [...get().globalEffects];
    next[index] = effect;
    set({ globalEffects: next });
  },
  removeGlobalEffect: (index) =>
    set({ globalEffects: get().globalEffects.filter((_, i) => i !== index) }),

  toggleGlobalEffectBypass: (index) => {
    const next = [...get().globalEffects];
    next[index] = { ...next[index], bypassed: !next[index].bypassed };
    set({ globalEffects: next });
  },
});
