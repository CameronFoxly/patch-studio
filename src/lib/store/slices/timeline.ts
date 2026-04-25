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

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  setLooping: (looping: boolean) => void;
  setRegionStart: (time: number) => void;
  setRegionEnd: (time: number) => void;
  setRegion: (start: number, end: number) => void;
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
  isLooping: false,
  regionStart: 0,
  regionEnd: 2,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setZoom: (zoom) => set({ zoom }),
  setScrollX: (scrollX) => set({ scrollX }),
  setLooping: (looping) => set({ isLooping: looping }),
  setRegionStart: (time) => set({ regionStart: Math.max(0, time) }),
  setRegionEnd: (time) => set({ regionEnd: Math.max(0, time) }),
  setRegion: (start, end) => set({ regionStart: Math.max(0, start), regionEnd: Math.max(0, end) }),
});
