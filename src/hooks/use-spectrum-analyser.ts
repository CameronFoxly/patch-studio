"use client";

import { useEffect, useRef, useCallback } from "react";
import { createMasterAnalyser } from "@web-kits/audio";
import type { AudioAnalyser } from "@web-kits/audio";

const FFT_SIZE = 4096;
const SMOOTHING = 0.75;
const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;

// Singleton analyser shared across the app
let sharedAnalyser: AudioAnalyser | null = null;
let refCount = 0;

function getAnalyser(): AudioAnalyser {
  if (!sharedAnalyser) {
    sharedAnalyser = createMasterAnalyser({
      fftSize: FFT_SIZE,
      smoothingTimeConstant: SMOOTHING,
      minDecibels: MIN_DECIBELS,
      maxDecibels: MAX_DECIBELS,
    });
  }
  refCount++;
  return sharedAnalyser;
}

function releaseAnalyser() {
  refCount--;
  if (refCount <= 0 && sharedAnalyser) {
    sharedAnalyser.dispose();
    sharedAnalyser = null;
    refCount = 0;
  }
}

/**
 * Provides a stable reference to a master bus analyser and a
 * requestAnimationFrame loop that calls the given draw callback
 * with byte frequency data each frame.
 */
export function useSpectrumAnalyser(
  draw: (frequencyData: Uint8Array, binCount: number) => void,
  active: boolean,
) {
  const analyserRef = useRef<AudioAnalyser | null>(null);
  const rafRef = useRef<number | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const startLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const tick = () => {
      const data = analyser.getFrequencyData();
      drawRef.current(data, analyser.frequencyBinCount);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopLoop();
      return;
    }

    analyserRef.current = getAnalyser();
    startLoop();

    return () => {
      stopLoop();
      releaseAnalyser();
      analyserRef.current = null;
    };
  }, [active, startLoop, stopLoop]);
}
