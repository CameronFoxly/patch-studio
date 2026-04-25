"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Play, Square, Repeat } from "lucide-react";

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const isLooping = useStore((s) => s.isLooping);
  const setLooping = useStore((s) => s.setLooping);
  const currentTime = useStore((s) => s.currentTime);
  const regionStart = useStore((s) => s.regionStart);
  const regionEnd = useStore((s) => s.regionEnd);
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
      <Button
        size="sm"
        variant={isLooping ? "secondary" : "ghost"}
        onClick={() => setLooping(!isLooping)}
        className="gap-1.5"
        title="Toggle loop"
      >
        <Repeat className={`h-4 w-4 ${isLooping ? "text-primary" : "text-muted-foreground"}`} />
        Loop
      </Button>
      <div className="text-xs font-mono text-muted-foreground ml-2">
        {currentTime.toFixed(2)}s
        <span className="mx-1.5 text-border">|</span>
        Region: {regionStart.toFixed(1)}s – {regionEnd.toFixed(1)}s
      </div>
    </div>
  );
}
