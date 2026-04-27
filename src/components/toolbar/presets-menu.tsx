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

interface PresetsMenuProps {
  /** "replace" replaces all layers; "append" adds to existing layers */
  mode?: "replace" | "append";
  /** Custom trigger button — if omitted, renders the default Presets button */
  trigger?: React.ReactNode;
}

export function PresetsMenu({ mode = "replace", trigger }: PresetsMenuProps) {
  const setLayers = useStore((s) => s.setLayers);
  const appendLayers = useStore((s) => s.appendLayers);
  const setGlobalEffects = useStore((s) => s.setGlobalEffects);
  const selectLayer = useStore((s) => s.selectLayer);
  const setPatchName = useStore((s) => s.setPatchName);
  const layers = useStore((s) => s.layers);
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [soundsMap, setSoundsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingPresetRef = useRef<{ collectionId: string; soundKey: string } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Compute fixed position and max height from trigger button
  const menuPos = (() => {
    if (!triggerRef.current) return { top: 0, left: 0, maxHeight: 400, openUp: false };
    const rect = triggerRef.current.getBoundingClientRect();
    const midpoint = window.innerHeight / 2;
    const openUp = rect.bottom > midpoint;

    if (openUp) {
      return {
        top: undefined as number | undefined,
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        maxHeight: rect.top - 20,
        openUp,
      };
    }
    return {
      top: rect.bottom + 4,
      bottom: undefined as number | undefined,
      left: rect.left,
      maxHeight: window.innerHeight - rect.bottom - 20,
      openUp,
    };
  })();

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

      if (mode === "append") {
        appendLayers(loadedLayers);
        selectLayer(loadedLayers[0].id);
      } else {
        setLayers(loadedLayers);
        setGlobalEffects([]);
        selectLayer(loadedLayers[0].id);
        setPatchName(soundKey);
      }
      setOpen(false);
    },
    [mode, setLayers, appendLayers, setGlobalEffects, selectLayer, setPatchName],
  );

  const handleSelect = useCallback(
    (collectionId: string, soundKey: string) => {
      if (mode === "append") {
        // Append never needs confirmation — it doesn't destroy existing work
        loadPreset(collectionId, soundKey);
      } else if (layers.length > 0) {
        pendingPresetRef.current = { collectionId, soundKey };
        setShowConfirm(true);
      } else {
        loadPreset(collectionId, soundKey);
      }
    },
    [mode, layers.length, loadPreset],
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
      <div ref={triggerRef} onClick={() => setOpen(!open)}>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
          >
            <Library className="h-4 w-4" />
            Presets
          </Button>
        )}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />

          {/* Panel — fixed positioning to escape parent overflow/stacking */}
          <div
            className="fixed z-[101] flex bg-popover border border-border rounded-md shadow-xl overflow-hidden"
            style={{ top: menuPos.top, bottom: menuPos.bottom, left: menuPos.left, maxHeight: menuPos.maxHeight }}
          >
            {/* Collection list */}
            <div className="w-52 border-r border-border flex-shrink-0 flex flex-col">
              <div className="px-3 py-2 border-b border-border flex-shrink-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </p>
              </div>
              <div className="py-1 overflow-y-auto flex-1 min-h-0">
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
            <div className="w-80 flex-shrink-0 flex flex-col">
              {activeCollection && (
                <div className="px-3 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
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
              <div className="p-2 overflow-y-auto flex-1 min-h-0">
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
