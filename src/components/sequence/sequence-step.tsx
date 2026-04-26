"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SliderInput } from "@/components/ui/slider-input";
import type { SequenceStep as SequenceStepType, Layer } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface Props {
  step: SequenceStepType;
  index: number;
  layers: Layer[];
  isActive: boolean;
}

export function SequenceStep({ step, index, layers, isActive }: Props) {
  const removeStep = useStore((s) => s.removeSequenceStep);
  const updateStep = useStore((s) => s.updateSequenceStep);

  const assignedLayer = step.layerId
    ? layers.find((l) => l.id === step.layerId)
    : null;

  return (
    <div
      className={`flex-shrink-0 w-32 h-28 rounded-md border p-2 flex flex-col gap-1 transition-colors ${
        isActive
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">
          #{index + 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => removeStep(step.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Layer selector */}
      <select
        value={step.layerId ?? ""}
        onChange={(e) => {
          const layerId = e.target.value || null;
          updateStep(step.id, { layerId });
        }}
        className="h-6 text-[10px] rounded border bg-background px-1 truncate w-full"
      >
        <option value="">— no sound —</option>
        {layers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {assignedLayer && (
        <span className="text-[9px] text-muted-foreground truncate">
          {assignedLayer.source.type}
          {assignedLayer.source.type !== "noise" && "frequency" in assignedLayer.source
            ? ` ${assignedLayer.source.frequency}Hz`
            : ""}
        </span>
      )}

      <div className="mt-auto">
        <SliderInput
          label="Vol"
          min={0}
          max={1}
          step={0.01}
          value={step.volume ?? 1}
          onChange={(v) => updateStep(step.id, { volume: v })}
        />
      </div>
    </div>
  );
}
