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
  const globalEffects = useStore((s) => s.globalEffects);
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
    if (!isPlayingRef.current) return;
    const currentLayers = useStore.getState().layers;
    const currentGlobalEffects = useStore.getState().globalEffects;
    try {
      const voice = await playSound(currentLayers, currentGlobalEffects);
      if (!isPlayingRef.current) {
        if (voice?.stop) voice.stop();
        return;
      }
      voiceRef.current = voice;
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
      if (!isPlayingRef.current) return;

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

  // Live retrigger: throttle — fire immediately on first change, then cooldown
  const lastRetriggerRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    const elapsed = now - lastRetriggerRef.current;
    const COOLDOWN = 80; // ms between retriggers

    if (elapsed >= COOLDOWN) {
      // Fire immediately
      lastRetriggerRef.current = now;
      triggerSound();
    } else {
      // Schedule for end of cooldown
      if (retriggerTimerRef.current) {
        clearTimeout(retriggerTimerRef.current);
      }
      retriggerTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          lastRetriggerRef.current = Date.now();
          triggerSound();
        }
        retriggerTimerRef.current = null;
      }, COOLDOWN - elapsed);
    }

    return () => {
      if (retriggerTimerRef.current) {
        clearTimeout(retriggerTimerRef.current);
        retriggerTimerRef.current = null;
      }
    };
  }, [layers, globalEffects, triggerSound]);

  return { play, stop };
}
