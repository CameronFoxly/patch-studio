"use client";

import { useCallback } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WaveformCanvas } from "./waveform-canvas";
import type { Layer } from "@/lib/types";
import { Volume2, VolumeX, Trash2, Copy, Star } from "lucide-react";

interface Props {
  layer: Layer;
  isSelected: boolean;
}

export function TimelineLayer({ layer, isSelected }: Props) {
  const selectLayer = useStore((s) => s.selectLayer);
  const removeLayer = useStore((s) => s.removeLayer);
  const duplicateLayer = useStore((s) => s.duplicateLayer);
  const toggleLayerMute = useStore((s) => s.toggleLayerMute);
  const toggleLayerSolo = useStore((s) => s.toggleLayerSolo);

  const handleClick = useCallback(() => {
    selectLayer(layer.id);
  }, [selectLayer, layer.id]);

  // Calculate the visual offset based on delay (200px per second)
  const delayOffset = (layer.delay || 0) * 200;

  const sourceLabel = (() => {
    if (layer.source.type === "noise") {
      return `${layer.source.color || "white"} noise`;
    }
    if (layer.source.type === "wavetable") {
      return `wavetable · ${layer.source.frequency}Hz`;
    }
    const freq = layer.source.frequency;
    const freqStr =
      typeof freq === "number" ? `${freq}Hz` : `${freq.start}→${freq.end}Hz`;
    return `${layer.source.type} · ${freqStr}`;
  })();

  return (
    <div
      onClick={handleClick}
      className={`flex items-stretch h-20 cursor-pointer transition-colors ${
        isSelected ? "bg-accent" : "hover:bg-muted/50"
      } ${layer.muted ? "opacity-50" : ""}`}
    >
      {/* Layer controls */}
      <div className="w-48 flex-shrink-0 flex items-center gap-1 px-3 border-r bg-card">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{layer.name}</p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {sourceLabel}
          </p>
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerMute(layer.id);
            }}
          >
            {layer.muted ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerSolo(layer.id);
            }}
          >
            <Star
              className={`h-3 w-3 ${layer.solo ? "fill-yellow-500 text-yellow-500" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              duplicateLayer(layer.id);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              removeLayer(layer.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Waveform area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-y-1 rounded-md bg-primary/10 border border-primary/20"
          style={{ left: `${delayOffset}px`, width: "300px" }}
        >
          <WaveformCanvas source={layer.source} />
        </div>
      </div>
    </div>
  );
}
