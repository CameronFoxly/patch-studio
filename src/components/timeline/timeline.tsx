"use client";

import { useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { TimelineLayer } from "./timeline-layer";
import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Timeline() {
  const layers = useStore((s) => s.layers);
  const addLayer = useStore((s) => s.addLayer);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Determine ruler interval based on zoom
  const rulerInterval = zoom >= 200 ? 0.25 : zoom >= 80 ? 0.5 : 1;
  const rulerCount = Math.ceil(10 / rulerInterval);

  return (
    <div
      ref={containerRef}
      className="h-full flex-1 flex flex-col bg-background"
      onWheel={handleWheel}
    >
      {/* Time ruler + zoom controls */}
      <div className="h-8 border-b bg-muted/30 flex items-center px-4">
        <div className="flex-1 flex items-end overflow-hidden">
          <div className="flex text-[10px] text-muted-foreground font-mono" style={{ gap: `${rulerInterval * zoom}px` }}>
            {Array.from({ length: rulerCount }, (_, i) => (
              <span key={i} className="flex-shrink-0">
                {(i * rulerInterval).toFixed(rulerInterval < 1 ? (rulerInterval < 0.5 ? 2 : 1) : 0)}s
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoom(clampZoom(zoom * 0.8))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">
            {Math.round(zoom)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoom(clampZoom(zoom * 1.25))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-h-full">
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm mb-4">
                No layers yet. Add a layer to get started.
              </p>
              <Button
                onClick={() => addLayer()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Layer
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {layers.map((layer) => (
                <TimelineLayer
                  key={layer.id}
                  layer={layer}
                  isSelected={layer.id === selectedLayerId}
                />
              ))}
            </div>
          )}

          {layers.length > 0 && (
            <div className="p-4">
              <Button
                onClick={() => addLayer()}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
                Add Layer
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
