"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SliderInput } from "@/components/ui/slider-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SequenceStep } from "./sequence-step";
import { useSequenceEngine } from "@/hooks/use-sequence-engine";
import { Plus, Play, Square } from "lucide-react";
import { useState } from "react";

export function SequenceEditor() {
  const showSequenceEditor = useStore((s) => s.showSequenceEditor);
  const toggleSequenceEditor = useStore((s) => s.toggleSequenceEditor);
  const steps = useStore((s) => s.sequenceSteps);
  const addStep = useStore((s) => s.addSequenceStep);
  const options = useStore((s) => s.sequenceOptions);
  const setOptions = useStore((s) => s.setSequenceOptions);
  const activeStepIndex = useStore((s) => s.activeStepIndex);
  const layers = useStore((s) => s.layers);

  const { play, stop } = useSequenceEngine();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    setIsPlaying(true);
    await play();
  };

  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };

  return (
    <div className="h-full overflow-auto border-t bg-card">
      <button
        onClick={toggleSequenceEditor}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span>Sequence Editor ({steps.length} steps)</span>
        <span className="text-xs text-muted-foreground">
          {showSequenceEditor ? "▼" : "▲"}
        </span>
      </button>

      {showSequenceEditor && (
        <div className="px-4 pb-4 space-y-3">
          {/* Transport + BPM controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              className="gap-1.5"
              onClick={isPlaying ? handleStop : handlePlay}
              disabled={steps.length === 0}
            >
              {isPlaying ? (
                <>
                  <Square className="h-3 w-3" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Play
                </>
              )}
            </Button>

            <div className="w-36">
              <SliderInput
                label="BPM"
                min={20}
                max={300}
                step={1}
                value={options.bpm ?? 120}
                format={(v) => `${v}`}
                onChange={(v) => setOptions({ bpm: v })}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Loop</Label>
              <Switch
                checked={options.loop ?? false}
                onCheckedChange={(loop) => setOptions({ loop })}
                size="sm"
              />
            </div>

            <span className="text-[10px] text-muted-foreground ml-auto">
              Step = {(60 / (options.bpm ?? 120)).toFixed(3)}s
            </span>
          </div>

          {/* Step grid */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <SequenceStep
                key={step.id}
                step={step}
                index={i}
                layers={layers}
                isActive={activeStepIndex === i}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-28 w-28 flex-col gap-1"
              onClick={addStep}
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Step</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
