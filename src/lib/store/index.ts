import { create } from "zustand";
import { temporal } from "zundo";
import { useStore as useZustandStore } from "zustand";

import { type LayersSlice, createLayersSlice, INITIAL_LAYER_ID } from "./slices/layers";
import { type TimelineSlice, createTimelineSlice } from "./slices/timeline";
import { type SequenceSlice, createSequenceSlice } from "./slices/sequence";
import { type UISlice, createUISlice } from "./slices/ui";

export type StoreState = LayersSlice & TimelineSlice & SequenceSlice & UISlice;

export const useStore = create<StoreState>()(
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
        pastState.sequenceSteps === currentState.sequenceSteps &&
        pastState.sequenceOptions === currentState.sequenceOptions,
    },
  ),
);

// Hook to subscribe to temporal store state (for canUndo/canRedo)
export function useTemporalState<T>(selector: (state: ReturnType<typeof useStore.temporal.getState>) => T): T {
  return useZustandStore(useStore.temporal, selector);
}

// Direct access to temporal store for imperative actions
export const temporalStore = useStore.temporal;
