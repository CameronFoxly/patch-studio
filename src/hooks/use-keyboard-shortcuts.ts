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

const DEFAULT_ZOOM = 400;
const MIN_ZOOM = 20;
const MAX_ZOOM = 500;
function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function useKeyboardShortcuts() {
  const { play, stop } = useAudioEngine();
  const isPlaying = useStore((s) => s.isPlaying);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;
      const typing = isTextInputFocused();

      // Space = play/stop (always, unless typing in a text field)
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        e.stopPropagation();
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

      // --- Zoom shortcuts (⌘+/⌘=, ⌘-, ⌘0) ---
      if (isCmd && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        const zoom = useStore.getState().zoom;
        useStore.getState().setZoom(clampZoom(zoom * 1.25));
      }
      if (isCmd && e.key === "-") {
        e.preventDefault();
        const zoom = useStore.getState().zoom;
        useStore.getState().setZoom(clampZoom(zoom * 0.8));
      }
      if (isCmd && e.key === "0") {
        e.preventDefault();
        useStore.getState().setZoom(DEFAULT_ZOOM);
      }

      // All remaining shortcuts require no text input focus and no modifier keys
      if (typing || isCmd || e.altKey) return;

      const state = useStore.getState();

      // L = toggle loop
      if (e.key === "l") {
        e.preventDefault();
        state.setLooping(!state.isLooping);
      }

      // G = toggle grid
      if (e.key === "g") {
        e.preventDefault();
        state.setQuantizeEnabled(!state.quantizeEnabled);
      }

      // N = toggle snap
      if (e.key === "n") {
        e.preventDefault();
        state.setSnapEnabled(!state.snapEnabled);
      }

      // --- Layer shortcuts (require a selected layer) ---
      const layerId = state.selectedLayerId;
      if (!layerId) return;

      // M = mute selected layer
      if (e.key === "m") {
        e.preventDefault();
        state.toggleLayerMute(layerId);
      }

      // S = solo selected layer
      if (e.key === "s") {
        e.preventDefault();
        state.toggleLayerSolo(layerId);
      }

      // D = duplicate selected layer
      if (e.key === "d") {
        e.preventDefault();
        state.duplicateLayer(layerId);
      }

      // Delete / Backspace = delete selected layer
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.removeLayer(layerId);
        // Select another layer if available
        const remaining = state.layers.filter((l) => l.id !== layerId);
        state.selectLayer(remaining.length > 0 ? remaining[0].id : null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, play, stop]);
}
