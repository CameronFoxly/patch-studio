"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Library, Loader2, ChevronRight } from "lucide-react";
import { presetCollections } from "@/lib/presets/registry";
import { getSoundNames, loadPresetSound } from "@/lib/presets/loader";
import { useStore } from "@/lib/store";
import { ConfirmDialog } from "./confirm-dialog";

function formatSoundName(key: string): string {
  return key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PresetsMenu() {
  const setLayers = useStore((s) => s.setLayers);
  const setGlobalEffects = useStore((s) => s.setGlobalEffects);
  const selectLayer = useStore((s) => s.selectLayer);
  const layers = useStore((s) => s.layers);
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [soundsMap, setSoundsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingPresetRef = useRef<{ collectionId: string; soundKey: string } | null>(null);

  // Fetch all collections on first open
  useEffect(() => {
    if (!open) return;
    if (Object.keys(soundsMap).length > 0) return;

    setLoading(true);
    Promise.all(
      presetCollections.map(async (c) => {
        const keys = await getSoundNames(c.id);
        return [c.id, keys] as const;
      }),
    ).then((results) => {
      const map: Record<string, string[]> = {};
      for (const [id, keys] of results) {
        map[id] = keys;
      }
      setSoundsMap(map);
      setLoading(false);
      setSelectedCollection((prev) => prev ?? presetCollections[0].id);
    });
  }, [open, soundsMap]);

  const loadPreset = useCallback(
    async (collectionId: string, soundKey: string) => {
      const loadedLayers = await loadPresetSound(collectionId, soundKey);
      if (!loadedLayers || loadedLayers.length === 0) return;
      setLayers(loadedLayers);
      setGlobalEffects([]);
      selectLayer(loadedLayers[0].id);
      setOpen(false);
    },
    [setLayers, setGlobalEffects, selectLayer],
  );

  const handleSelect = useCallback(
    (collectionId: string, soundKey: string) => {
      // If there's existing work, confirm before overwriting
      if (layers.length > 0) {
        pendingPresetRef.current = { collectionId, soundKey };
        setShowConfirm(true);
      } else {
        loadPreset(collectionId, soundKey);
      }
    },
    [layers.length, loadPreset],
  );

  const handleConfirmLoad = useCallback(() => {
    const pending = pendingPresetRef.current;
    if (pending) {
      loadPreset(pending.collectionId, pending.soundKey);
      pendingPresetRef.current = null;
    }
  }, [loadPreset]);

  const activeCollection = presetCollections.find((c) => c.id === selectedCollection);
  const activeKeys = selectedCollection ? soundsMap[selectedCollection] : null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <Library className="h-4 w-4" />
        Presets
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-1 z-50 flex bg-popover border border-border rounded-md shadow-xl overflow-hidden">
            {/* Collection list */}
            <div className="w-52 border-r border-border flex-shrink-0">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </p>
              </div>
              <div className="py-1">
                {presetCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors text-sm ${
                      selectedCollection === collection.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{collection.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {collection.description}
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 flex-shrink-0 ml-2 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sound grid */}
            <div className="w-80 flex-shrink-0">
              {activeCollection && (
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {activeCollection.name}
                  </p>
                  {activeKeys && (
                    <span className="text-[10px] text-muted-foreground">
                      {activeKeys.length} sounds
                    </span>
                  )}
                </div>
              )}
              <div className="p-2">
                {loading || !activeKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {activeKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSelect(selectedCollection!, key)}
                        className="px-2 py-1.5 text-xs text-left rounded-md hover:bg-accent hover:text-accent-foreground transition-colors truncate"
                        title={formatSoundName(key)}
                      >
                        {formatSoundName(key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => {
          setShowConfirm(open);
          if (!open) pendingPresetRef.current = null;
        }}
        onConfirm={handleConfirmLoad}
        title="Replace current patch?"
        description="Loading a preset will replace your current layers and effects. This action can be undone."
      />
    </div>
  );
}
