"use client";

import { useStore } from "@/lib/store";
import { TimelineLayer } from "./timeline-layer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Timeline() {
  const layers = useStore((s) => s.layers);
  const addLayer = useStore((s) => s.addLayer);
  const selectedLayerId = useStore((s) => s.selectedLayerId);

  return (
    <div className="h-full flex-1 flex flex-col bg-background">
      {/* Time ruler */}
      <div className="h-8 border-b bg-muted/30 flex items-end px-4">
        <div className="flex gap-[100px] text-[10px] text-muted-foreground font-mono">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i}>{(i * 0.5).toFixed(1)}s</span>
          ))}
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
