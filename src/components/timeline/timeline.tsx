"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TimelineLayer } from "./timeline-layer";
import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut, Library } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresetsMenu } from "@/components/toolbar/presets-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const DEFAULT_CONTROLS_WIDTH = 264;
const MOBILE_CONTROLS_WIDTH = 140;
const MIN_CONTROLS_WIDTH = 140;
const MAX_CONTROLS_WIDTH = 400;

export function Timeline() {
  const layers = useStore((s) => s.layers);
  const addLayer = useStore((s) => s.addLayer);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const isPlaying = useStore((s) => s.isPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const regionEnd = useStore((s) => s.regionEnd);
  const setRegionEnd = useStore((s) => s.setRegionEnd);
  const reorderLayers = useStore((s) => s.reorderLayers);
  const quantizeEnabled = useStore((s) => s.quantizeEnabled);
  const bpm = useStore((s) => s.bpm);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Resizable controls width — sync to narrower default on mobile after mount
  const [controlsWidth, setControlsWidth] = useState(DEFAULT_CONTROLS_WIDTH);
  const initializedMobileWidth = useRef(false);

  useEffect(() => {
    if (!initializedMobileWidth.current && window.innerWidth < 768) {
      initializedMobileWidth.current = true;
      setControlsWidth(MOBILE_CONTROLS_WIDTH);
    }
  }, []);

  // Drag reorder state
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const clampZoom = useCallback(
    (value: number) => Math.min(500, Math.max(20, value)),
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(clampZoom(zoom * factor));
    },
    [zoom, setZoom, clampZoom],
  );

  // Ruler interval based on zoom
  const rulerInterval = zoom >= 200 ? 0.25 : zoom >= 80 ? 0.5 : 1;
  const rulerCount = Math.ceil(10 / rulerInterval) + 1;

  // Quantize grid
  const gridStep = 60 / bpm; // seconds per beat
  const gridCount = quantizeEnabled ? Math.ceil(10 / gridStep) + 1 : 0;

  // Click + drag ruler to scrub
  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!rulerRef.current) return;
      e.preventDefault();
      const rect = rulerRef.current.getBoundingClientRect();
      const xToTime = (clientX: number) => Math.max(0, (clientX - rect.left) / zoom);

      setCurrentTime(xToTime(e.clientX));

      const onMove = (moveE: MouseEvent) => {
        setCurrentTime(xToTime(moveE.clientX));
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [zoom, setCurrentTime],
  );

  // Region bracket dragging (end only — start is always 0)
  const handleBracketDrag = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const startVal = regionEnd;

      const handleMove = (moveE: MouseEvent) => {
        const dx = moveE.clientX - startX;
        const newVal = Math.max(0.1, startVal + dx / zoom);
        setRegionEnd(newVal);
      };

      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [zoom, regionEnd, setRegionEnd],
  );

  // Playhead position in pixels
  const playheadX = currentTime * zoom;

  // Drag reorder handlers
  const handleDragStart = useCallback((index: number) => {
    setDragFromIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderLayers(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, dragOverIndex, reorderLayers]);

  // Controls column resize
  const handleControlsResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = controlsWidth;

      const onMove = (moveE: MouseEvent) => {
        const dx = moveE.clientX - startX;
        setControlsWidth(
          Math.min(MAX_CONTROLS_WIDTH, Math.max(MIN_CONTROLS_WIDTH, startWidth + dx)),
        );
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [controlsWidth],
  );

  return (
    <div
      ref={containerRef}
      className="h-full flex-1 flex flex-col bg-background"
      onWheel={handleWheel}
    >
      {/* Time ruler + zoom controls */}
      <div className="h-8 border-b bg-muted/30 flex items-center relative">
        {/* Spacer matching layer controls width */}
        <div className="flex-shrink-0 relative" style={{ width: controlsWidth }}>
          {/* Resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 z-10"
            onMouseDown={handleControlsResize}
          />
        </div>

        {/* Ruler area */}
        <div
          ref={rulerRef}
          className="flex-1 relative overflow-hidden cursor-pointer h-full select-none"
          onMouseDown={handleRulerMouseDown}
        >
          {/* Region highlight */}
          <div
            className="absolute inset-y-0 bg-foreground/[0.06] dark:bg-foreground/[0.08]"
            style={{
              left: 0,
              width: `${regionEnd * zoom}px`,
            }}
          />

          {/* Region end bracket */}
          <div
            className="absolute inset-y-0 w-2 cursor-col-resize z-10 group"
            style={{ left: `${regionEnd * zoom - 4}px` }}
            onMouseDown={handleBracketDrag}
          >
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary/60 group-hover:bg-primary" />
            <div className="absolute top-0 left-0 w-2 h-3 bg-primary/60 group-hover:bg-primary rounded-b-sm" />
          </div>

          {/* Time marks */}
          <div className="flex items-end h-full">
            {Array.from({ length: rulerCount }, (_, i) => {
              const time = i * rulerInterval;
              return (
                <div
                  key={i}
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: `${time * zoom}px` }}
                >
                  <span className="text-[10px] text-muted-foreground font-mono mb-0.5 pointer-events-none select-none">
                    {time.toFixed(rulerInterval < 1 ? (rulerInterval < 0.5 ? 2 : 1) : 0)}s
                  </span>
                  <div className="w-px h-1.5 bg-muted-foreground/30" />
                </div>
              );
            })}
          </div>

          {/* Quantize grid ticks on ruler */}
          {quantizeEnabled && Array.from({ length: gridCount }, (_, i) => {
            const time = i * gridStep;
            return (
              <div
                key={`q-${i}`}
                className="absolute bottom-0 w-px h-2 bg-primary/30 pointer-events-none"
                style={{ left: `${time * zoom}px` }}
              />
            );
          })}

          {/* Playhead on ruler */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
            style={{ left: `${playheadX}px` }}
          >
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-destructive" />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 mx-2 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoom(clampZoom(zoom * 0.8))}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                Zoom out <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">−</kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">
            {Math.round(zoom)}%
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoom(clampZoom(zoom * 1.25))}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                Zoom in <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">+</kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Layers + playhead */}
      <ScrollArea className="flex-1">
        <div className="min-h-full relative">
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm mb-4">
                No layers yet. Add a layer to get started.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => addLayer()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Layer
                </Button>
                <PresetsMenu
                  mode="append"
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Library className="h-4 w-4" />
                      Add Preset
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="divide-y relative">
              {layers.map((layer, index) => {
                const anySolo = layers.some((l) => l.solo);
                return (
                  <TimelineLayer
                    key={layer.id}
                    layer={layer}
                    index={index}
                    isSelected={layer.id === selectedLayerId}
                    isDragOver={dragOverIndex === index}
                    isFaded={anySolo && !layer.solo}
                    controlsWidth={controlsWidth}
                    onControlsResize={handleControlsResize}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={() => handleDragOver(index)}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}

              {/* Quantize grid lines across layers */}
              {quantizeEnabled && Array.from({ length: gridCount }, (_, i) => {
                const time = i * gridStep;
                return (
                  <div
                    key={`grid-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-primary/10 pointer-events-none"
                    style={{ left: `${controlsWidth + time * zoom}px` }}
                  />
                );
              })}

              {/* Playhead line across all layers */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive/70 z-10 pointer-events-none"
                style={{ left: `${controlsWidth + playheadX}px` }}
              />
            </div>
          )}

          {layers.length > 0 && (
            <div className="p-4 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={() => addLayer()}
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        Add Layer
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">
                    Add layer <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">A</kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PresetsMenu
                mode="append"
                trigger={
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Library className="h-4 w-4" />
                    Add Preset
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
