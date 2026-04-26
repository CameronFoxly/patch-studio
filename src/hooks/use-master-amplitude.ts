"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { createMasterAnalyser } from "@web-kits/audio";
import type { AudioAnalyser } from "@web-kits/audio";
import { useStore } from "@/lib/store";

/**
 * Hooks into the master audio bus and returns a live RMS amplitude (0–1).
 * Automatically starts/stops the analyser when playback begins/ends.
 */
export function useMasterAmplitude(): number {
  const isPlaying = useStore((s) => s.isPlaying);
  const [amplitude, setAmplitude] = useState(0);
  const analyserRef = useRef<AudioAnalyser | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = analyser.getFloatTimeDomainData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    // Scale RMS to a 0-1 range (typical RMS for audio peaks ~0.3-0.7)
    const scaled = Math.min(1, rms * 2.5);
    setAmplitude(scaled);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      try {
        analyserRef.current = createMasterAnalyser({ fftSize: 256, smoothingTimeConstant: 0.5 });
      } catch {
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.dispose();
        analyserRef.current = null;
      }
      if (!isPlaying) {
        setAmplitude(0);
      }
    };
  }, [isPlaying, tick]);

  return amplitude;
}
