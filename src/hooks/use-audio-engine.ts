"use client";

import { useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

export function useAudioEngine() {
  const voiceRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const retriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  const layers = useStore((s) => s.layers);
  const setPlaying = useStore((s) => s.setPlaying);
  const setCurrentTime = useStore((s) => s.setCurrentTime);

  const stopVoice = useCallback(() => {
    if (voiceRef.current?.stop) {
      voiceRef.current.stop();
    }
    voiceRef.current = null;
  }, []);

  const stopPlayhead = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const triggerSound = useCallback(async () => {
    stopVoice();
    const currentLayers = useStore.getState().layers;
    try {
      voiceRef.current = await playSound(currentLayers);
    } catch (e) {
      console.error("Playback error:", e);
    }
  }, [stopVoice]);

  const play = useCallback(async () => {
    stopVoice();
    stopPlayhead();

    const state = useStore.getState();
    const { regionStart } = state;

    isPlayingRef.current = true;
    setPlaying(true);
    setCurrentTime(regionStart);
    startTimeRef.current = performance.now();

    const animate = () => {
      const { isLooping, regionStart, regionEnd } = useStore.getState();
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      let time = regionStart + elapsed;

      if (time >= regionEnd) {
        if (isLooping) {
          startTimeRef.current = performance.now();
          time = regionStart;
          triggerSound();
        } else {
          setCurrentTime(regionEnd);
          isPlayingRef.current = false;
          setPlaying(false);
          voiceRef.current = null;
          return;
        }
      }

      setCurrentTime(time);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    await triggerSound();
  }, [setPlaying, setCurrentTime, stopVoice, stopPlayhead, triggerSound]);

  const stop = useCallback(() => {
    stopVoice();
    stopPlayhead();
    isPlayingRef.current = false;
    setPlaying(false);
    if (retriggerTimerRef.current) {
      clearTimeout(retriggerTimerRef.current);
      retriggerTimerRef.current = null;
    }
  }, [setPlaying, stopVoice, stopPlayhead]);

  // Live retrigger: debounce 150ms after layer changes while playing
  useEffect(() => {
    if (!isPlayingRef.current) return;

    if (retriggerTimerRef.current) {
      clearTimeout(retriggerTimerRef.current);
    }
    retriggerTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        triggerSound();
      }
      retriggerTimerRef.current = null;
    }, 150);

    return () => {
      if (retriggerTimerRef.current) {
        clearTimeout(retriggerTimerRef.current);
        retriggerTimerRef.current = null;
      }
    };
  }, [layers, triggerSound]);

  return { play, stop };
}
