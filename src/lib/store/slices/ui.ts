import type { StateCreator } from "zustand";
import type { StoreState } from "../index";

export type SidebarPanel =
  | "source"
  | "filter"
  | "envelope"
  | "effects"
  | "modulation"
  | "spatial"
  | "global-effects";

export interface UISlice {
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  activeSidebarPanel: SidebarPanel;
  showSequenceEditor: boolean;
  sidebarWidth: number;
  lfoInteractionLayerId: string | null;
  patchName: string;

  selectLayer: (id: string | null) => void;
  toggleLayerInSelection: (id: string) => void;
  selectLayerRange: (targetId: string) => void;
  setSelectedLayerIds: (ids: string[]) => void;
  setActiveSidebarPanel: (panel: SidebarPanel) => void;
  toggleSequenceEditor: () => void;
  setSidebarWidth: (width: number) => void;
  setLfoInteractionLayerId: (layerId: string | null) => void;
  setPatchName: (name: string) => void;
}

// Sanitize patch name for safe use as JSON key / filename
export function sanitizePatchName(raw: string): string {
  return raw.replace(/[^\w\s\-().]/g, "");
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
  get,
) => ({
  selectedLayerId: null as string | null,
  selectedLayerIds: [] as string[],
  activeSidebarPanel: "source",
  showSequenceEditor: false,
  sidebarWidth: 256,
  lfoInteractionLayerId: null,
  patchName: "Untitled",

  selectLayer: (id) => set({ selectedLayerId: id, selectedLayerIds: id ? [id] : [] }),

  toggleLayerInSelection: (id) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.includes(id)) {
      const next = selectedLayerIds.filter((lid) => lid !== id);
      set({
        selectedLayerIds: next,
        selectedLayerId: next.length > 0 ? next[next.length - 1] : null,
      });
    } else {
      set({
        selectedLayerIds: [...selectedLayerIds, id],
        selectedLayerId: id,
      });
    }
  },

  selectLayerRange: (targetId) => {
    const { layers, selectedLayerId } = get();
    if (!selectedLayerId) {
      set({ selectedLayerIds: [targetId], selectedLayerId: targetId });
      return;
    }
    const anchorIdx = layers.findIndex((l) => l.id === selectedLayerId);
    const targetIdx = layers.findIndex((l) => l.id === targetId);
    if (anchorIdx === -1 || targetIdx === -1) return;
    const start = Math.min(anchorIdx, targetIdx);
    const end = Math.max(anchorIdx, targetIdx);
    const rangeIds = layers.slice(start, end + 1).map((l) => l.id);
    set({ selectedLayerIds: rangeIds });
  },

  setSelectedLayerIds: (ids) => set({
    selectedLayerIds: ids,
    selectedLayerId: ids.length > 0 ? ids[0] : null,
  }),

  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  toggleSequenceEditor: () =>
    set({ showSequenceEditor: !get().showSequenceEditor }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setLfoInteractionLayerId: (layerId) => set({ lfoInteractionLayerId: layerId }),
  setPatchName: (name) => set({ patchName: sanitizePatchName(name) || "Untitled" }),
});
