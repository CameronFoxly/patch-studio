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

  selectLayer: (id: string | null) => void;
  setActiveSidebarPanel: (panel: SidebarPanel) => void;
  toggleSequenceEditor: () => void;
  setSidebarWidth: (width: number) => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
  get,
) => ({
  selectedLayerId: null,
  activeSidebarPanel: "source",
  showSequenceEditor: false,
  sidebarWidth: 320,

  selectLayer: (id) => set({ selectedLayerId: id }),
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  toggleSequenceEditor: () =>
    set({ showSequenceEditor: !get().showSequenceEditor }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
});
