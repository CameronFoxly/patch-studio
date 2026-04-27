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
  activeSidebarPanel: SidebarPanel;
  showSequenceEditor: boolean;
  sidebarWidth: number;
  lfoInteractionLayerId: string | null;
  patchName: string;

  selectLayer: (id: string | null) => void;
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
  activeSidebarPanel: "source",
  showSequenceEditor: false,
  sidebarWidth: 256,
  lfoInteractionLayerId: null,
  patchName: "Untitled",

  selectLayer: (id) => set({ selectedLayerId: id }),
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  toggleSequenceEditor: () =>
    set({ showSequenceEditor: !get().showSequenceEditor }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setLfoInteractionLayerId: (layerId) => set({ lfoInteractionLayerId: layerId }),
  setPatchName: (name) => set({ patchName: sanitizePatchName(name) || "Untitled" }),
});
