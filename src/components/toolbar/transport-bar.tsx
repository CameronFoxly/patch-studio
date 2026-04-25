"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Play, Square } from "lucide-react";

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const { play, stop } = useAudioEngine();
  const layerCount = useStore((s) => s.layers.length);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
      <Button
        size="sm"
        variant={isPlaying ? "destructive" : "default"}
        onClick={isPlaying ? stop : play}
        disabled={layerCount === 0}
        className="gap-2"
      >
        {isPlaying ? (
          <Square className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isPlaying ? "Stop" : "Play"}
      </Button>
    </div>
  );
}
