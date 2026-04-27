import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import { useStore as useZustandStore } from "zustand";

import { type LayersSlice, createLayersSlice, INITIAL_LAYER_ID } from "./slices/layers";
import { type TimelineSlice, createTimelineSlice } from "./slices/timeline";
import { type SequenceSlice, createSequenceSlice } from "./slices/sequence";
import { type UISlice, createUISlice } from "./slices/ui";

export type StoreState = LayersSlice & TimelineSlice & SequenceSlice & UISlice;

export const useStore = create<StoreState>()(
  persist(
    temporal(
      (...a) => ({
        ...createLayersSlice(...a),
        ...createTimelineSlice(...a),
        ...createSequenceSlice(...a),
        ...createUISlice(...a),
        selectedLayerId: INITIAL_LAYER_ID,
      }),
      {
        // Only track undoable state (layers, sequence) — not transient UI/timeline state
        equality: (pastState, currentState) =>
          pastState.layers === currentState.layers &&
          pastState.globalEffects === currentState.globalEffects &&
          pastState.sequenceSteps === currentState.sequenceSteps &&
          pastState.sequenceOptions === currentState.sequenceOptions,
      },
    ),
    {
      name: "patch-studio-session",
      version: 1,
      // Persist sound design & settings — not transient playback state
      partialize: (state) => ({
        layers: state.layers,
        globalEffects: state.globalEffects,
        sequenceSteps: state.sequenceSteps,
        sequenceOptions: state.sequenceOptions,
        patchName: state.patchName,
        selectedLayerId: state.selectedLayerId,
        activeSidebarPanel: state.activeSidebarPanel,
        showSequenceEditor: state.showSequenceEditor,
        zoom: state.zoom,
        scrollX: state.scrollX,
        isLooping: state.isLooping,
        regionStart: state.regionStart,
        regionEnd: state.regionEnd,
        bpm: state.bpm,
        snapEnabled: state.snapEnabled,
        quantizeEnabled: state.quantizeEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clear undo history so the hydration merge isn't undoable
        useStore.temporal.getState().clear();
        // Ensure selectedLayerId still references a valid layer
        const validIds = state.layers.map((l) => l.id);
        if (state.selectedLayerId && !validIds.includes(state.selectedLayerId)) {
          state.selectLayer(validIds[0] ?? null);
        }
      },
    },
  ),
);

// Hook to subscribe to temporal store state (for canUndo/canRedo)
export function useTemporalState<T>(selector: (state: ReturnType<typeof useStore.temporal.getState>) => T): T {
  return useZustandStore(useStore.temporal, selector);
}

// Direct access to temporal store for imperative actions
export const temporalStore = useStore.temporal;
