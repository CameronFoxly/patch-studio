"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Play, Square, Repeat, Grid3x3, Magnet } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const isLooping = useStore((s) => s.isLooping);
  const setLooping = useStore((s) => s.setLooping);
  const currentTime = useStore((s) => s.currentTime);
  const regionEnd = useStore((s) => s.regionEnd);
  const setRegionEnd = useStore((s) => s.setRegionEnd);
  const quantizeEnabled = useStore((s) => s.quantizeEnabled);
  const setQuantizeEnabled = useStore((s) => s.setQuantizeEnabled);
  const bpm = useStore((s) => s.bpm);
  const setBpm = useStore((s) => s.setBpm);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const setSnapEnabled = useStore((s) => s.setSnapEnabled);
  const { play, stop } = useAudioEngine();
  const layerCount = useStore((s) => s.layers.length);

  const [endText, setEndText] = useState(regionEnd.toFixed(2));
  const [endFocused, setEndFocused] = useState(false);
  const [bpmText, setBpmText] = useState(String(bpm));
  const [bpmFocused, setBpmFocused] = useState(false);

  useEffect(() => {
    if (!endFocused) setEndText(regionEnd.toFixed(2));
  }, [regionEnd, endFocused]);

  useEffect(() => {
    if (!bpmFocused) setBpmText(String(bpm));
  }, [bpm, bpmFocused]);

  function commitEnd() {
    const parsed = parseFloat(endText);
    if (!isNaN(parsed) && parsed > 0) {
      setRegionEnd(parsed);
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
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-card overflow-x-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant={isPlaying ? "destructive" : "default"}
                className={isPlaying ? "" : "bg-emerald-600 text-white hover:bg-emerald-700"}
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
            }
          />
          <TooltipContent side="bottom">
            {isPlaying ? "Stop" : "Play"} <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">Space</kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant={isLooping ? "secondary" : "ghost"}
                onClick={() => setLooping(!isLooping)}
              >
                <Repeat className={`h-4 w-4 ${isLooping ? "text-primary" : "text-muted-foreground"}`} />
                Loop
              </Button>
            }
          />
          <TooltipContent side="bottom">
            Toggle loop <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">L</kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" className="self-stretch -my-2" />

      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span>{currentTime.toFixed(2)}s</span>

        <Separator orientation="vertical" className="self-stretch -my-2" />

        <span>Preview Range:</span>
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

      <Separator orientation="vertical" className="self-stretch -my-2" />

      {/* Quantize / Snap / BPM controls */}
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant={quantizeEnabled ? "secondary" : "ghost"}
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => setQuantizeEnabled(!quantizeEnabled)}
                >
                  <Grid3x3 className={`h-3 w-3 ${quantizeEnabled ? "text-primary" : "text-muted-foreground"}`} />
                  Grid
                </Button>
              }
            />
            <TooltipContent side="bottom">
              Toggle grid <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">G</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant={snapEnabled ? "secondary" : "ghost"}
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => setSnapEnabled(!snapEnabled)}
                >
                  <Magnet className={`h-3 w-3 ${snapEnabled ? "text-primary" : "text-muted-foreground"}`} />
                  Snap
                </Button>
              }
            />
            <TooltipContent side="bottom">
              Snap to grid <kbd className="ml-1 rounded border border-background/20 bg-background/10 px-1 py-0.5 font-mono text-[10px]">N</kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="self-stretch -my-2" />

        <span className="text-muted-foreground">BPM</span>
        <Slider
          min={20}
          max={300}
          step={1}
          value={[bpm]}
          onValueChange={(v) => setBpm(Array.isArray(v) ? v[0] : (v as number))}
          className="data-horizontal:w-32 shrink-0"
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
