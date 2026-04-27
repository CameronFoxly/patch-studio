import type { StateCreator } from "zustand";
import type { StoreState } from "../index";

export interface TimelineSlice {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  scrollX: number;
  isLooping: boolean;
  regionStart: number;
  regionEnd: number;
  quantizeEnabled: boolean;
  bpm: number;
  snapEnabled: boolean;

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  setLooping: (looping: boolean) => void;
  setRegionEnd: (time: number) => void;
  setQuantizeEnabled: (enabled: boolean) => void;
  setBpm: (bpm: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
}

export const createTimelineSlice: StateCreator<
  StoreState,
  [],
  [],
  TimelineSlice
> = (set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 2,
  zoom: 400,
  scrollX: 0,
  isLooping: true,
  regionStart: 0,
  regionEnd: 2,
  quantizeEnabled: false,
  bpm: 120,
  snapEnabled: false,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setZoom: (zoom) => set({ zoom }),
  setScrollX: (scrollX) => set({ scrollX }),
  setLooping: (looping) => set({ isLooping: looping }),
  setRegionEnd: (time) => set({ regionEnd: Math.max(0.01, time) }),
  setQuantizeEnabled: (enabled) => set({ quantizeEnabled: enabled }),
  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
});
