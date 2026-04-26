"use client";

import { useEffect } from "react";
import { useStore, temporalStore } from "@/lib/store";
import { useAudioEngine } from "./use-audio-engine";

function isTextInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return type === "text" || type === "number" || type === "search" || type === "url" || type === "email" || type === "password";
  }
  return el.getAttribute("contenteditable") === "true";
}

export function useKeyboardShortcuts() {
  const { play, stop } = useAudioEngine();
  const isPlaying = useStore((s) => s.isPlaying);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;

      // Space = play/stop (always, unless typing in a text field)
      if (e.code === "Space" && !isTextInputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        // Blur any focused element (buttons, sliders) so space doesn't activate them
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        if (isPlaying) stop();
        else play();
      }

      // Cmd+Z = undo
      if (isCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        temporalStore.getState().undo();
      }

      // Cmd+Shift+Z or Cmd+Y = redo
      if (isCmd && (e.key === "Z" || e.key === "y")) {
        e.preventDefault();
        temporalStore.getState().redo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, play, stop]);
}
