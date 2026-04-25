"use client";

import { useCallback, useRef } from "react";
import { playSound } from "@/lib/audio/engine";
import { useStore } from "@/lib/store";

export function useAudioEngine() {
  const voiceRef = useRef<any>(null);
  const layers = useStore((s) => s.layers);
  const setPlaying = useStore((s) => s.setPlaying);

  const play = useCallback(async () => {
    if (voiceRef.current?.stop) {
      voiceRef.current.stop();
    }

    setPlaying(true);
    try {
      voiceRef.current = await playSound(layers);
    } catch (e) {
      console.error("Playback error:", e);
      setPlaying(false);
    }
  }, [layers, setPlaying]);

  const stop = useCallback(() => {
    if (voiceRef.current?.stop) {
      voiceRef.current.stop();
    }
    voiceRef.current = null;
    setPlaying(false);
  }, [setPlaying]);

  return { play, stop };
}
