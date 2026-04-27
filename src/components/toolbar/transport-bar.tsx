"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Play, Square, Repeat, Grid3x3, Magnet } from "lucide-react";

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const isLooping = useStore((s) => s.isLooping);
  const setLooping = useStore((s) => s.setLooping);
  const currentTime = useStore((s) => s.currentTime);
  const regionStart = useStore((s) => s.regionStart);
  const regionEnd = useStore((s) => s.regionEnd);
  const setRegionStart = useStore((s) => s.setRegionStart);
  const setRegionEnd = useStore((s) => s.setRegionEnd);
  const quantizeEnabled = useStore((s) => s.quantizeEnabled);
  const setQuantizeEnabled = useStore((s) => s.setQuantizeEnabled);
  const bpm = useStore((s) => s.bpm);
  const setBpm = useStore((s) => s.setBpm);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const setSnapEnabled = useStore((s) => s.setSnapEnabled);
  const { play, stop } = useAudioEngine();
  const layerCount = useStore((s) => s.layers.length);

  const [startText, setStartText] = useState(regionStart.toFixed(2));
  const [endText, setEndText] = useState(regionEnd.toFixed(2));
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);
  const [bpmText, setBpmText] = useState(String(bpm));
  const [bpmFocused, setBpmFocused] = useState(false);

  useEffect(() => {
    if (!startFocused) setStartText(regionStart.toFixed(2));
  }, [regionStart, startFocused]);

  useEffect(() => {
    if (!endFocused) setEndText(regionEnd.toFixed(2));
  }, [regionEnd, endFocused]);

  useEffect(() => {
    if (!bpmFocused) setBpmText(String(bpm));
  }, [bpm, bpmFocused]);

  function commitStart() {
    const parsed = parseFloat(startText);
    if (!isNaN(parsed) && parsed >= 0) {
      setRegionStart(Math.min(parsed, regionEnd - 0.01));
    }
    setStartText(regionStart.toFixed(2));
  }

  function commitEnd() {
    const parsed = parseFloat(endText);
    if (!isNaN(parsed) && parsed > 0) {
      setRegionEnd(Math.max(parsed, regionStart + 0.01));
    }
    setEndText(regionEnd.toFixed(2));
  }

  function commitBpm() {
    const parsed = parseInt(bpmText, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 300) {
      setBpm(parsed);
    }
    setBpmText(String(bpm));
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
        <span>Preview Range:</span>
        <input
          type="text"
          inputMode="decimal"
          value={startFocused ? startText : `${regionStart.toFixed(2)}s`}
          onChange={(e) => setStartText(e.target.value)}
          onFocus={() => {
            setStartFocused(true);
            setStartText(regionStart.toFixed(2));
          }}
          onBlur={() => {
            setStartFocused(false);
            commitStart();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-5 w-12 rounded border border-input bg-background px-1 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
        <span>–</span>
        <input
          type="text"
          inputMode="decimal"
          value={endFocused ? endText : `${regionEnd.toFixed(2)}s`}
          onChange={(e) => setEndText(e.target.value)}
          onFocus={() => {
            setEndFocused(true);
            setEndText(regionEnd.toFixed(2));
          }}
          onBlur={() => {
            setEndFocused(false);
            commitEnd();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-5 w-12 rounded border border-input bg-background px-1 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Quantize / Snap / BPM controls */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground ml-2">
        <span className="text-border">|</span>
        <Button
          size="sm"
          variant={quantizeEnabled ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setQuantizeEnabled(!quantizeEnabled)}
          title="Show quantize grid"
        >
          <Grid3x3 className={`h-3 w-3 ${quantizeEnabled ? "text-primary" : "text-muted-foreground"}`} />
          Grid
        </Button>
        <Button
          size="sm"
          variant={snapEnabled ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setSnapEnabled(!snapEnabled)}
          title="Snap layers to grid"
        >
          <Magnet className={`h-3 w-3 ${snapEnabled ? "text-primary" : "text-muted-foreground"}`} />
          Snap
        </Button>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">BPM</span>
        <Slider
          min={20}
          max={300}
          step={1}
          value={[bpm]}
          onValueChange={(v) => setBpm(Array.isArray(v) ? v[0] : (v as number))}
          className="w-24"
        />
        <input
          type="text"
          inputMode="numeric"
          value={bpmFocused ? bpmText : String(bpm)}
          onChange={(e) => setBpmText(e.target.value)}
          onFocus={() => {
            setBpmFocused(true);
            setBpmText(String(bpm));
          }}
          onBlur={() => {
            setBpmFocused(false);
            commitBpm();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-5 w-10 rounded border border-input bg-background px-1 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}
