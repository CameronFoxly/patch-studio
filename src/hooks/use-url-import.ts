"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { importPatch } from "@/lib/audio/patch-converter";
import { useStore } from "@/lib/store";
import type { SoundPatch } from "@/lib/types";

/**
 * Checks for a `#import=<base64>` hash fragment on page load.
 * If found, decodes the patch JSON and imports it into the store,
 * showing a confirmation dialog if there are existing layers.
 */
export function useUrlImport() {
  const layers = useStore((s) => s.layers);
  const setLayers = useStore((s) => s.setLayers);
  const setGlobalEffects = useStore((s) => s.setGlobalEffects);
  const selectLayer = useStore((s) => s.selectLayer);
  const setPatchName = useStore((s) => s.setPatchName);

  const [showConfirm, setShowConfirm] = useState(false);
  const pendingPatchRef = useRef<SoundPatch | null>(null);
  const hasCheckedRef = useRef(false);

  const applyPatch = useCallback(
    (json: SoundPatch) => {
      try {
        const { layers: imported, globalEffects: importedGlobal } =
          importPatch(json);
        setLayers(imported);
        setGlobalEffects(importedGlobal);
        if (json.name) setPatchName(json.name);
        if (imported.length > 0) selectLayer(imported[0].id);
      } catch (err) {
        console.error("Failed to import patch from URL:", err);
      }

      // Clear the hash so refreshing doesn't re-import
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    },
    [setLayers, setGlobalEffects, selectLayer, setPatchName],
  );

  // Check for hash fragment on mount
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const hash = window.location.hash;
    if (!hash.startsWith("#import=")) return;

    const encoded = hash.slice("#import=".length);
    if (!encoded) return;

    let json: SoundPatch;
    try {
      json = JSON.parse(decodeURIComponent(atob(encoded))) as SoundPatch;
    } catch (err) {
      console.error("Failed to decode patch from URL hash:", err);
      return;
    }

    // If there are existing layers, show confirmation first
    if (useStore.getState().layers.length > 0) {
      pendingPatchRef.current = json;
      setShowConfirm(true);
    } else {
      applyPatch(json);
    }
  }, [applyPatch]);

  const handleConfirm = useCallback(() => {
    const json = pendingPatchRef.current;
    if (json) {
      applyPatch(json);
      pendingPatchRef.current = null;
    }
  }, [applyPatch]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setShowConfirm(open);
      if (!open) {
        pendingPatchRef.current = null;
        // Clear the hash even if the user cancelled
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    },
    [],
  );

  return { showConfirm, handleConfirm, handleOpenChange };
}
