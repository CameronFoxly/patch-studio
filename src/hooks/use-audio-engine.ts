"use client";

import { useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

const CROSSFADE_RELEASE = 0.06; // seconds — old voice fade-out duration
const RETRIGGER_COOLDOWN = 150; // ms — minimum gap between live retriggers

export function useAudioEngine() {
  const voiceRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const retriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRetriggerRef = useRef<number>(0);
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

  // Hard retrigger: stop old voice immediately, start new one.
  // Used at loop boundaries where we want a clean restart.
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

  // Cross-fade retrigger: start new voice, then fade out old one.
  // Used for live parameter tweaks so the transition is smooth.
  const crossfadeRetrigger = useCallback(async () => {
    if (!isPlayingRef.current) return;
    const oldVoice = voiceRef.current;
    const currentLayers = useStore.getState().layers;
    const currentGlobalEffects = useStore.getState().globalEffects;
    try {
      const newVoice = await playSound(currentLayers, currentGlobalEffects);
      if (!isPlayingRef.current) {
        if (newVoice?.stop) newVoice.stop();
        return;
      }
      voiceRef.current = newVoice;
      // Fade out the old voice after the new one has started
      if (oldVoice?.stop) {
        oldVoice.stop(CROSSFADE_RELEASE);
      }
    } catch (e) {
      console.error("Playback error:", e);
    }
  }, []);

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

  // Live parameter updates: cross-fade retrigger with throttle.
  // Changes apply almost instantly via a smooth overlap, not a hard restart.
  useEffect(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    const elapsed = now - lastRetriggerRef.current;

    if (elapsed >= RETRIGGER_COOLDOWN) {
      lastRetriggerRef.current = now;
      crossfadeRetrigger();
    } else {
      if (retriggerTimerRef.current) {
        clearTimeout(retriggerTimerRef.current);
      }
      retriggerTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          lastRetriggerRef.current = Date.now();
          crossfadeRetrigger();
        }
        retriggerTimerRef.current = null;
      }, RETRIGGER_COOLDOWN - elapsed);
    }

    return () => {
      if (retriggerTimerRef.current) {
        clearTimeout(retriggerTimerRef.current);
        retriggerTimerRef.current = null;
      }
    };
  }, [layers, globalEffects, crossfadeRetrigger]);

  return { play, stop };
}
