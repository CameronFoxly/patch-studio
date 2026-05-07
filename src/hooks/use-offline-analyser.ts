"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { generateBuffer, ANALYSIS_SR, WAVEFORM_SR } from "@/lib/audio/sample-generator";
import { computeFFT } from "@/lib/audio/fft";
import { ENVELOPE_TAIL } from "@/lib/audio/constants";
import type { Layer } from "@/lib/types";

const FFT_SIZE = 4096;
const BUFFER_DEBOUNCE_MS = 300;
const SCRUB_THROTTLE_MS = 60;
const LIVE_TWEAK_THROTTLE_MS = 80;

/**
 * Compute the total duration of a layer (envelope-based).
 * Mirrors the logic in waveform-canvas.tsx.
 */
function layerDuration(layer: Layer): number {
  const env = layer.envelope;
  return env
    ? (env.attack || 0) + env.decay + (env.release || 0) + ENVELOPE_TAIL
    : 2;
}

/**
 * Mix multiple layer buffers into a single mono buffer.
 * Layers may have different lengths — output length = longest layer.
 */
function mixBuffers(
  layers: Layer[],
  buffers: Float32Array[],
): Float32Array {
  let maxLen = 0;
  for (const buf of buffers) {
    if (buf.length > maxLen) maxLen = buf.length;
  }
  const mix = new Float32Array(maxLen);
  for (let li = 0; li < buffers.length; li++) {
    const buf = buffers[li];
    const gain = layers[li].gain ?? 1;
    for (let i = 0; i < buf.length; i++) {
      mix[i] += buf[i] * gain;
    }
  }
  // Clamp to [-1, 1]
  for (let i = 0; i < maxLen; i++) {
    if (mix[i] > 1) mix[i] = 1;
    else if (mix[i] < -1) mix[i] = -1;
  }
  return mix;
}

/**
 * Get the active (non-muted, solo-aware) layers.
 */
function getActiveLayers(layers: Layer[]): Layer[] {
  const anySolo = layers.some((l) => l.solo);
  return layers.filter((l) => {
    if (l.muted) return false;
    if (anySolo && !l.solo) return false;
    return true;
  });
}

/**
 * Hook that performs offline FFT analysis at the current scrub position
 * and calls the draw callback with frequency data.
 *
 * Active only when `enabled` is true (typically `!isPlaying && !collapsed`).
 */
export function useOfflineAnalyser(
  draw: (frequencyData: Uint8Array, binCount: number) => void,
  enabled: boolean,
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const mixedBufferRef = useRef<Float32Array | null>(null);
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastComputeRef = useRef<number>(0);
  const lastTweakRegenRef = useRef<number>(0);
  const tweakThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate the mixed buffer from current store state at a given sample rate
  const regenerateBuffer = useCallback((sampleRate: number = ANALYSIS_SR) => {
    const { layers } = useStore.getState();
    const active = getActiveLayers(layers);
    if (active.length === 0) {
      mixedBufferRef.current = null;
      return;
    }

    const buffers = active.map((layer) => {
      const dur = layerDuration(layer);
      return generateBuffer(layer, dur, sampleRate);
    });

    mixedBufferRef.current = mixBuffers(active, buffers);
  }, []);

  // Compute FFT at a given time position and draw
  const computeAndDraw = useCallback(
    (time: number) => {
      const buffer = mixedBufferRef.current;
      if (!buffer || buffer.length === 0) {
        drawRef.current(new Uint8Array(FFT_SIZE / 2), FFT_SIZE / 2);
        return;
      }
      // Determine sample rate from buffer length vs duration
      const { layers } = useStore.getState();
      const active = getActiveLayers(layers);
      const maxDur = active.length > 0
        ? Math.max(...active.map(layerDuration))
        : 2;
      const bufferSR = buffer.length / maxDur;
      const sampleOffset = Math.round(time * bufferSR);
      const clampedOffset = Math.max(0, Math.min(buffer.length - 1, sampleOffset));
      const freqData = computeFFT(buffer, FFT_SIZE, clampedOffset);
      drawRef.current(freqData, FFT_SIZE / 2);
    },
    [],
  );

  // Subscribe to layer/effect changes → immediate low-res + deferred high-res buffer regen
  useEffect(() => {
    if (!enabled) return;

    // Initial generation (high-res)
    regenerateBuffer(ANALYSIS_SR);

    let prevLayers = useStore.getState().layers;
    let prevFx = useStore.getState().globalEffects;

    const unsub = useStore.subscribe((state) => {
      if (state.layers === prevLayers && state.globalEffects === prevFx) return;
      prevLayers = state.layers;
      prevFx = state.globalEffects;

      // Immediate low-res regen (throttled) for live visual feedback during drags
      const now = performance.now();
      const tweakElapsed = now - lastTweakRegenRef.current;

      if (tweakElapsed >= LIVE_TWEAK_THROTTLE_MS) {
        lastTweakRegenRef.current = now;
        regenerateBuffer(WAVEFORM_SR);
        if (!state.isPlaying) {
          computeAndDraw(state.currentTime);
        }
      } else if (!tweakThrottleTimerRef.current) {
        tweakThrottleTimerRef.current = setTimeout(() => {
          tweakThrottleTimerRef.current = null;
          lastTweakRegenRef.current = performance.now();
          regenerateBuffer(WAVEFORM_SR);
          const { currentTime, isPlaying } = useStore.getState();
          if (!isPlaying) computeAndDraw(currentTime);
        }, LIVE_TWEAK_THROTTLE_MS - tweakElapsed);
      }

      // Deferred high-res regen for full-quality display once adjustments settle
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      regenTimerRef.current = setTimeout(() => {
        regenerateBuffer(ANALYSIS_SR);
        const { currentTime, isPlaying } = useStore.getState();
        if (!isPlaying) {
          computeAndDraw(currentTime);
        }
      }, BUFFER_DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      if (tweakThrottleTimerRef.current) clearTimeout(tweakThrottleTimerRef.current);
    };
  }, [enabled, regenerateBuffer, computeAndDraw]);

  // Subscribe to currentTime changes → throttled FFT computation
  useEffect(() => {
    if (!enabled) return;

    // Draw once for current position on mount
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
