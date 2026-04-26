"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WaveformCanvas } from "./waveform-canvas";
import { EnvelopeOverlay } from "./envelope-overlay";
import type { Layer } from "@/lib/types";
import { Volume2, VolumeX, Trash2, Copy, Star, GripVertical, Activity } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  layer: Layer;
  index: number;
  isSelected: boolean;
  isDragOver: boolean;
  isFaded: boolean;
  controlsWidth: number;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}

export function TimelineLayer({
  layer,
  index,
  isSelected,
  isDragOver,
  isFaded,
  controlsWidth,
  onDragStart,
  onDragOver,
  onDragEnd,
}: Props) {
  const selectLayer = useStore((s) => s.selectLayer);
  const removeLayer = useStore((s) => s.removeLayer);
  const duplicateLayer = useStore((s) => s.duplicateLayer);
  const toggleLayerMute = useStore((s) => s.toggleLayerMute);
  const toggleLayerSolo = useStore((s) => s.toggleLayerSolo);
  const toggleLayerEnvelopeOverlay = useStore((s) => s.toggleLayerEnvelopeOverlay);
  const updateLayerDelay = useStore((s) => s.updateLayerDelay);
  const updateLayerName = useStore((s) => s.updateLayerName);
  const updateLayerEnvelope = useStore((s) => s.updateLayerEnvelope);
  const updateLayerGain = useStore((s) => s.updateLayerGain);
  const zoom = useStore((s) => s.zoom);

  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const dragStartRef = useRef<{ mouseX: number; startDelay: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    selectLayer(layer.id);
  }, [selectLayer, layer.id]);

  // Drag-to-reposition: update onset delay
  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      selectLayer(layer.id);
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        startDelay: layer.delay || 0,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = moveEvent.clientX - dragStartRef.current.mouseX;
        const deltaSeconds = dx / zoom;
        const newDelay = Math.max(0, dragStartRef.current.startDelay + deltaSeconds);
        updateLayerDelay(layer.id, Math.round(newDelay * 100) / 100);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [layer.id, layer.delay, zoom, selectLayer, updateLayerDelay],
  );

  // Editable layer name
  const handleNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(layer.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [layer.name]);

  const commitName = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== layer.name) {
      updateLayerName(layer.id, trimmed);
    }
    setIsEditing(false);
  }, [editName, layer.id, layer.name, updateLayerName]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitName();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [commitName],
  );

  // Calculate visual offset and width based on zoom (pixels per second)
  const delayOffset = (layer.delay || 0) * zoom;
  const env = layer.envelope;
  const soundDuration = env
    ? (env.attack || 0) + env.decay + (env.release || 0) + 0.5
    : 2;
  const blockWidth = Math.max(soundDuration * zoom, 40);

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
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd();
      }}
      onDragEnd={onDragEnd}
      className={`flex items-stretch h-20 cursor-pointer transition-colors ${
        isSelected ? "bg-accent" : "hover:bg-muted/50"
      } ${layer.muted || isFaded ? "opacity-50" : ""} ${
        isDragOver ? "border-t-2 border-primary" : ""
      }`}
    >
      {/* Layer controls */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 border-r bg-card" style={{ width: controlsWidth }}>
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <p
              className="text-sm font-medium truncate cursor-text hover:text-primary transition-colors"
              onClick={handleNameClick}
              title="Click to rename"
            >
              {layer.name}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground capitalize">
            {sourceLabel}
          </p>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerEnvelopeOverlay(layer.id);
                    }}
                  >
                    <Activity
                      className={`h-3 w-3 ${layer.showEnvelope ? "text-primary" : ""}`}
                    />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Envelope overlay</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
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
                }
              />
              <TooltipContent side="bottom">{layer.muted ? "Unmute" : "Mute"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
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
                }
              />
              <TooltipContent side="bottom">Solo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
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
                }
              />
              <TooltipContent side="bottom">Duplicate</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
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
                }
              />
              <TooltipContent side="bottom">Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Waveform area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-y-1 rounded-sm bg-primary/10 border border-primary/20 ${
            isDragging ? "cursor-grabbing ring-2 ring-primary/40" : "cursor-grab hover:border-primary/40"
          }`}
          style={{ left: `${delayOffset}px`, width: `${blockWidth}px` }}
          onMouseDown={handleBlockMouseDown}
        >
          <WaveformCanvas layer={layer} />
          {/* Envelope overlay */}
          {layer.showEnvelope && layer.envelope && (
            <EnvelopeOverlay
              layer={layer}
              blockWidth={blockWidth}
              onUpdateEnvelope={(env) => updateLayerEnvelope(layer.id, env)}
              onUpdateGain={(g) => updateLayerGain(layer.id, g)}
            />
          )}
          {/* Delay label */}
          {(layer.delay || 0) > 0 && (
            <span className="absolute top-0.5 left-1 text-[9px] font-mono text-muted-foreground">
              {(layer.delay || 0).toFixed(2)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
