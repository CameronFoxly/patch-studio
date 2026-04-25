"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "./use-audio-engine";

function isInputFocused() {
  const tag = document.activeElement?.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useKeyboardShortcuts() {
  const { play, stop } = useAudioEngine();
  const isPlaying = useStore((s) => s.isPlaying);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;

      // Space = play/stop
      if (e.code === "Space" && !isInputFocused()) {
        e.preventDefault();
        if (isPlaying) stop();
        else play();
      }

      // Cmd+Z = undo
      if (isCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useStore.temporal.getState().undo();
      }

      // Cmd+Shift+Z or Cmd+Y = redo
      if (isCmd && (e.key === "Z" || e.key === "y")) {
        e.preventDefault();
        useStore.temporal.getState().redo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, play, stop]);
}
