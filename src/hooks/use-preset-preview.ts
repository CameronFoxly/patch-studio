"use client";

import { useCallback, useRef, useEffect } from "react";
import { ensureReady } from "@web-kits/audio";
import { getRawSoundSync } from "@/lib/presets/loader";
import { previewPresetSound, stopPresetPreview } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

const HOVER_DELAY_MS = 150;

export function usePresetPreview() {
  const previewEnabled = useStore((s) => s.presetPreviewEnabled);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(previewEnabled);
  enabledRef.current = previewEnabled;

  // Pre-warm AudioContext so first hover has no latency
  useEffect(() => {
    ensureReady().catch(() => {});
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerEnter = useCallback(
    (collectionId: string, soundKey: string) => {
      if (!enabledRef.current) return;

      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const raw = getRawSoundSync(collectionId, soundKey);
        if (!raw) return;
        previewPresetSound(raw as unknown as Record<string, unknown>);
      }, HOVER_DELAY_MS);
    },
    [clearTimer],
  );

  const handlePointerLeave = useCallback(() => {
    clearTimer();
    stopPresetPreview();
  }, [clearTimer]);

  // Cleanup on unmount / menu close
  useEffect(() => {
    return () => {
      clearTimer();
      stopPresetPreview();
    };
  }, [clearTimer]);

  return { handlePointerEnter, handlePointerLeave };
}
