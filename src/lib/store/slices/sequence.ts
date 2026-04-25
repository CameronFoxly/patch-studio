import type { StateCreator } from "zustand";
import type { SequenceStep, SequenceOptions } from "@/lib/types";
import type { StoreState } from "../index";

export interface SequenceSlice {
  sequenceSteps: SequenceStep[];
  sequenceOptions: SequenceOptions;

  addSequenceStep: () => void;
  removeSequenceStep: (id: string) => void;
  updateSequenceStep: (id: string, updates: Partial<SequenceStep>) => void;
  reorderSequenceSteps: (fromIndex: number, toIndex: number) => void;
  setSequenceOptions: (options: Partial<SequenceOptions>) => void;
  clearSequence: () => void;
}

export const createSequenceSlice: StateCreator<
  StoreState,
  [],
  [],
  SequenceSlice
> = (set, get) => ({
  sequenceSteps: [],
  sequenceOptions: { bpm: 120, loop: false },

  addSequenceStep: () => {
    const step: SequenceStep = {
      id: crypto.randomUUID(),
      name: `Step ${get().sequenceSteps.length + 1}`,
      sound: {},
      duration: 0.5,
    };
    set({ sequenceSteps: [...get().sequenceSteps, step] });
  },

  removeSequenceStep: (id) => {
    set({ sequenceSteps: get().sequenceSteps.filter((s) => s.id !== id) });
  },

  updateSequenceStep: (id, updates) => {
    set({
      sequenceSteps: get().sequenceSteps.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    });
  },

  reorderSequenceSteps: (fromIndex, toIndex) => {
    const next = [...get().sequenceSteps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    set({ sequenceSteps: next });
  },

  setSequenceOptions: (options) => {
    set({ sequenceOptions: { ...get().sequenceOptions, ...options } });
  },

  clearSequence: () => {
    set({ sequenceSteps: [], sequenceOptions: { bpm: 120, loop: false } });
  },
});
