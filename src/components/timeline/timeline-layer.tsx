"use client";

import { useCallback, useRef, useState } from "react";
import { useStore, temporalStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { WaveformCanvas } from "./waveform-canvas";
import { EnvelopeOverlay } from "./envelope-overlay";
import { LfoOverlay } from "./lfo-overlay";
import type { Layer } from "@/lib/types";
import { ENVELOPE_TAIL } from "@/lib/audio/constants";import { Volume2, VolumeX, Trash2, Copy, Star, GripVertical, Activity } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

function first(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

interface Props {
  layer: Layer;
  index: number;
  isSelected: boolean;
  isDragOver: boolean;
  isFaded: boolean;
  controlsWidth: number;
  onControlsResize: (e: React.MouseEvent) => void;
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
  onControlsResize,
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
  const updateLayerPan = useStore((s) => s.updateLayerPan);
  const zoom = useStore((s) => s.zoom);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const bpm = useStore((s) => s.bpm);
  const quantizeEnabled = useStore((s) => s.quantizeEnabled);

  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const dragStartRef = useRef<{ mouseX: number; startDelay: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    selectLayer(layer.id);
  }, [selectLayer, layer.id]);

  // Drag-to-reposition: update onset delay (batched as single undo entry)
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

      // Snapshot pre-drag state and pause undo tracking so intermediate
      // moves don't flood the history — we record a single entry on release.
      const preDragState = useStore.getState();
      temporalStore.getState().pause();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = moveEvent.clientX - dragStartRef.current.mouseX;
        const deltaSeconds = dx / zoom;
        let newDelay = Math.max(0, dragStartRef.current.startDelay + deltaSeconds);
        if (snapEnabled) {
          const snapStep = 60 / bpm / 8; // 1/32 note (beat / 8)
          newDelay = Math.round(newDelay / snapStep) * snapStep;
        }
        updateLayerDelay(layer.id, Math.round(newDelay * 1000) / 1000);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;

        // Resume tracking and record the entire drag as one undo step
        const temporal = temporalStore.getState();
        temporal.resume();
        const currentDelay = useStore.getState().layers.find(l => l.id === layer.id)?.delay ?? 0;
        if (currentDelay !== (preDragState.layers.find(l => l.id === layer.id)?.delay ?? 0)) {
          temporalStore.setState({
            pastStates: [...temporal.pastStates, preDragState],
            futureStates: [],
          });
        }

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [layer.id, layer.delay, zoom, selectLayer, updateLayerDelay, snapEnabled, bpm],
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
    ? (env.attack || 0) + env.decay + (env.release || 0) + ENVELOPE_TAIL
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

  const gain = layer.gain ?? 0.8;
  const pan = layer.pan ?? 0;

  const formatPan = (v: number) =>
    v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : v > 0 ? `R${Math.round(v * 100)}` : "C";

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
      className={`flex items-stretch cursor-pointer transition-colors ${
        isSelected ? "bg-accent" : "hover:bg-muted/50"
      } ${layer.muted || isFaded ? "opacity-50" : ""} ${
        isDragOver ? "border-t-2 border-primary" : ""
      }`}
    >
      {/* Layer controls */}
      <div className="flex-shrink-0 flex border-r bg-card relative" style={{ width: controlsWidth }}>
        {/* Drag handle */}
        <div className="flex items-center flex-shrink-0 pl-1.5">
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 py-1.5 px-1.5 flex flex-col gap-1">
          {/* Top row: name + buttons */}
          <div className="flex items-center gap-1">
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
                  <TooltipContent side="bottom">Envelope overlay <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">E</kbd></TooltipContent>
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
                  <TooltipContent side="bottom">{layer.muted ? "Unmute" : "Mute"} <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">M</kbd></TooltipContent>
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
                  <TooltipContent side="bottom">Solo <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">S</kbd></TooltipContent>
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
                  <TooltipContent side="bottom">Duplicate <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">D</kbd></TooltipContent>
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
                  <TooltipContent side="bottom">Delete <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">⌫</kbd></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Gain slider */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0">Gain</span>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[gain]}
              onValueChange={(v) => updateLayerGain(layer.id, first(v))}
            />
            <span className="text-[10px] font-mono text-muted-foreground w-7 text-right flex-shrink-0">
              {Math.round(gain * 100)}%
            </span>
          </div>

          {/* Pan slider */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0">Pan</span>
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={[pan]}
              onValueChange={(v) => updateLayerPan(layer.id, first(v))}
            />
            <span className="text-[10px] font-mono text-muted-foreground w-7 text-right flex-shrink-0">
              {formatPan(pan)}
            </span>
            {pan !== 0 && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer"
                title="Reset to center"
                onClick={() => updateLayerPan(layer.id, 0)}
              >
                ↺
              </button>
            )}
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 z-10"
          onMouseDown={(e) => {
            e.stopPropagation();
            onControlsResize(e);
          }}
        />
      </div>

      {/* Waveform area */}
      <div className="flex-1 relative overflow-hidden">
        {/* 1/32 note tick marks along the bottom */}
        {quantizeEnabled && (() => {
          const subStep = 60 / bpm / 8; // 1/32 note
          const beatStep = 60 / bpm;
          const tickCount = Math.ceil(10 / subStep) + 1;
          return Array.from({ length: tickCount }, (_, i) => {
            const time = i * subStep;
            const isBeat = Math.abs(time % beatStep) < 0.0001 || Math.abs((time % beatStep) - beatStep) < 0.0001;
            return (
              <div
                key={`tick-${i}`}
                className={`absolute bottom-0 w-px pointer-events-none ${
                  isBeat ? "h-2 bg-primary/25" : "h-1 bg-primary/12"
                }`}
                style={{ left: `${time * zoom}px` }}
              />
            );
          });
        })()}
        <div
          className={`absolute inset-y-1 rounded-sm ${
            isDragging ? "cursor-grabbing ring-2 ring-primary/40" : "cursor-grab"
          }`}
          style={{
            left: `${delayOffset}px`,
            width: `${blockWidth}px`,
            backgroundColor: layer.color ? `color-mix(in srgb, ${layer.color} 12%, transparent)` : undefined,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: layer.color ? `color-mix(in srgb, ${layer.color} 30%, transparent)` : undefined,
          }}
          onMouseDown={handleBlockMouseDown}
          onMouseEnter={(e) => {
            if (!isDragging && layer.color) {
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${layer.color} 55%, transparent)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging && layer.color) {
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${layer.color} 30%, transparent)`;
            }
          }}
        >
          <WaveformCanvas layer={layer} color={layer.color} />
          {/* LFO overlay — shown while adjusting LFO knobs */}
          <LfoOverlay layer={layer} blockWidth={blockWidth} />
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
