"use client";

import { useCallback, useRef } from "react";
import { playSound } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

export function useAudioEngine() {
  const voiceRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const layers = useStore((s) => s.layers);
  const setPlaying = useStore((s) => s.setPlaying);
  const setCurrentTime = useStore((s) => s.setCurrentTime);

  const stopPlayhead = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const play = useCallback(async () => {
    if (voiceRef.current?.stop) {
      voiceRef.current.stop();
    }
    stopPlayhead();

    const state = useStore.getState();
    const { isLooping, regionStart, regionEnd } = state;
    const regionDuration = regionEnd - regionStart;

    setPlaying(true);
    setCurrentTime(regionStart);
    startTimeRef.current = performance.now();

    // Animate playhead
    const animate = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      let time = regionStart + elapsed;

      if (time >= regionEnd) {
        if (isLooping) {
          // Restart from region start
          startTimeRef.current = performance.now();
          time = regionStart;
          // Re-trigger sound for loop
          if (voiceRef.current?.stop) voiceRef.current.stop();
          playSound(layers).then((v) => { voiceRef.current = v; }).catch(() => {});
        } else {
          setCurrentTime(regionEnd);
          setPlaying(false);
          voiceRef.current = null;
          return;
        }
      }

      setCurrentTime(time);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    try {
      voiceRef.current = await playSound(layers);
    } catch (e) {
      console.error("Playback error:", e);
      setPlaying(false);
      stopPlayhead();
    }
  }, [layers, setPlaying, setCurrentTime, stopPlayhead]);

  const stop = useCallback(() => {
    if (voiceRef.current?.stop) {
      voiceRef.current.stop();
    }
    voiceRef.current = null;
    stopPlayhead();
    setPlaying(false);
  }, [setPlaying, stopPlayhead]);

  return { play, stop };
}
