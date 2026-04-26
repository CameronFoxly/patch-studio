"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Play, Square, Repeat } from "lucide-react";

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const isLooping = useStore((s) => s.isLooping);
  const setLooping = useStore((s) => s.setLooping);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const setDuration = useStore((s) => s.setDuration);
  const { play, stop } = useAudioEngine();
  const layerCount = useStore((s) => s.layers.length);

  const [durationText, setDurationText] = useState(duration.toFixed(1));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDurationText(duration.toFixed(1));
  }, [duration, focused]);

  function commitDuration() {
    const parsed = parseFloat(durationText);
    if (!isNaN(parsed) && parsed > 0) {
      setDuration(Math.min(300, Math.max(0.1, parsed)));
    }
    setDurationText(duration.toFixed(1));
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
      <Button
        size="sm"
        variant={isPlaying ? "destructive" : "default"}
        onClick={isPlaying ? stop : play}
        disabled={layerCount === 0}
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
        title="Toggle loop"
      >
        <Repeat className={`h-4 w-4 ${isLooping ? "text-primary" : "text-muted-foreground"}`} />
        Loop
      </Button>
      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground ml-2">
        <span>{currentTime.toFixed(2)}s</span>
        <span className="text-border">|</span>
        <span>Length:</span>
        <input
          type="text"
          inputMode="decimal"
          value={focused ? durationText : `${duration.toFixed(1)}s`}
          onChange={(e) => setDurationText(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setDurationText(duration.toFixed(1));
          }}
          onBlur={() => {
            setFocused(false);
            commitDuration();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-5 w-12 rounded border border-input bg-background px-1 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}
