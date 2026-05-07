"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { renderToBuffer } from "@web-kits/audio";
import { layersToSoundDefinition } from "@/lib/audio/engine";
import { computeFFT } from "@/lib/audio/fft";
import { ENVELOPE_TAIL } from "@/lib/audio/constants";
import type { Layer } from "@/lib/types";

const FFT_SIZE = 4096;
const SAMPLE_RATE = 44_100;
const BUFFER_DEBOUNCE_MS = 300;
const SCRUB_THROTTLE_MS = 60;
const LIVE_TWEAK_THROTTLE_MS = 80;

/**
 * Compute the total duration of a layer (envelope-based).
 */
function layerDuration(layer: Layer): number {
  const env = layer.envelope;
  return env
    ? (env.attack || 0) + env.decay + (env.release || 0) + ENVELOPE_TAIL
    : 2;
}

function getActiveLayers(layers: Layer[]): Layer[] {
  const anySolo = layers.some((l) => l.solo);
  return layers.filter((l) => {
    if (l.muted) return false;
    if (anySolo && !l.solo) return false;
    return true;
  });
}

/**
 * Hook that uses @web-kits/audio's renderToBuffer() for 1:1 parity
 * offline FFT analysis at the current scrub/paused position.
 */
export function useOfflineAnalyser(
  draw: (frequencyData: Uint8Array, binCount: number) => void,
  enabled: boolean,
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const renderedBufferRef = useRef<Float32Array | null>(null);
  const renderVersionRef = useRef(0);
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastComputeRef = useRef<number>(0);
  const lastTweakRegenRef = useRef<number>(0);
  const tweakThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render the sound offline using the real Web Audio pipeline
  const regenerateBuffer = useCallback(async () => {
    const { layers, globalEffects } = useStore.getState();
    const active = getActiveLayers(layers);
    if (active.length === 0) {
      renderedBufferRef.current = null;
      return;
    }

    const definition = layersToSoundDefinition(active, globalEffects);
    if (!definition) {
      renderedBufferRef.current = null;
      return;
    }

    const maxDur = Math.max(...active.map(layerDuration));
    const version = ++renderVersionRef.current;

    try {
      const audioBuffer = await renderToBuffer(
        definition as Parameters<typeof renderToBuffer>[0],
        {
          duration: maxDur,
          sampleRate: SAMPLE_RATE,
          numberOfChannels: 1,
        },
      );

      // Discard if a newer render has started
      if (version !== renderVersionRef.current) return;

      // Extract channel 0 as Float32Array
      renderedBufferRef.current = audioBuffer.getChannelData(0);
    } catch (e) {
      console.warn("Offline render failed:", e);
      renderedBufferRef.current = null;
    }
  }, []);

  // Compute FFT at a given time position and draw
  const computeAndDraw = useCallback(
    (time: number) => {
      const buffer = renderedBufferRef.current;
      if (!buffer || buffer.length === 0) {
        drawRef.current(new Uint8Array(FFT_SIZE / 2), FFT_SIZE / 2);
        return;
      }
      const sampleOffset = Math.round(time * SAMPLE_RATE);
      const clampedOffset = Math.max(0, Math.min(buffer.length - 1, sampleOffset));
      const freqData = computeFFT(buffer, FFT_SIZE, clampedOffset);
      drawRef.current(freqData, FFT_SIZE / 2);
    },
    [],
  );

  // Helper: regen + draw (async)
  const regenAndDraw = useCallback(async () => {
    await regenerateBuffer();
    const { currentTime, isPlaying } = useStore.getState();
    if (!isPlaying) computeAndDraw(currentTime);
  }, [regenerateBuffer, computeAndDraw]);

  // Subscribe to layer/effect changes → throttled + debounced offline renders
  useEffect(() => {
    if (!enabled) return;

    // Initial render
    regenAndDraw();

    let prevLayers = useStore.getState().layers;
    let prevFx = useStore.getState().globalEffects;

    const unsub = useStore.subscribe((state) => {
      if (state.layers === prevLayers && state.globalEffects === prevFx) return;
      prevLayers = state.layers;
      prevFx = state.globalEffects;

      // Immediate regen (throttled) for live visual feedback during drags
      const now = performance.now();
      const tweakElapsed = now - lastTweakRegenRef.current;

      if (tweakElapsed >= LIVE_TWEAK_THROTTLE_MS) {
        lastTweakRegenRef.current = now;
        regenAndDraw();
      } else if (!tweakThrottleTimerRef.current) {
        tweakThrottleTimerRef.current = setTimeout(() => {
          tweakThrottleTimerRef.current = null;
          lastTweakRegenRef.current = performance.now();
          regenAndDraw();
        }, LIVE_TWEAK_THROTTLE_MS - tweakElapsed);
      }

      // Final regen after adjustments settle
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      regenTimerRef.current = setTimeout(() => {
        regenAndDraw();
      }, BUFFER_DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      if (tweakThrottleTimerRef.current) clearTimeout(tweakThrottleTimerRef.current);
    };
  }, [enabled, regenAndDraw]);

  // Subscribe to currentTime changes → throttled FFT computation
  useEffect(() => {
    if (!enabled) return;

    const { currentTime } = useStore.getState();
    computeAndDraw(currentTime);

    let prevTime = currentTime;

    const unsub = useStore.subscribe((state) => {
      if (state.currentTime === prevTime) return;
      prevTime = state.currentTime;

      if (state.isPlaying) return;

      const now = performance.now();
      const elapsed = now - lastComputeRef.current;

      if (elapsed >= SCRUB_THROTTLE_MS) {
        lastComputeRef.current = now;
        computeAndDraw(state.currentTime);
      } else if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null;
          lastComputeRef.current = performance.now();
          const { currentTime: ct, isPlaying: ip } = useStore.getState();
          if (!ip) computeAndDraw(ct);
        }, SCRUB_THROTTLE_MS - elapsed);
      }
    });

    return () => {
      unsub();
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, [enabled, computeAndDraw]);
}
