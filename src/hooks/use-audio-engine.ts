"use client";

import { useCallback, useRef } from "react";
import { playSound } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

export function useAudioEngine() {
  const voiceRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

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
  }, [setPlaying, stopVoice, stopPlayhead]);

  // Parameter changes during playback are NOT retriggered mid-loop.
  // The loop boundary (in the animate callback) already calls triggerSound()
  // which reads fresh state from the store, so changes apply on the next cycle.
  // This avoids the machine-gun retrigger stutter when dragging sliders.

  return { play, stop };
}
