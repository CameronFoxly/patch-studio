import type { SoundPatch } from "@/lib/types";
import { presetCollections } from "./registry";

// For now, presets are loaded from bundled JSON files.
// In a future version, we could fetch from the npm registry.
export async function loadPreset(
  collectionId: string,
): Promise<SoundPatch | null> {
  try {
    const response = await fetch(`/presets/${collectionId}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function getPresetCollections() {
  return presetCollections;
}
