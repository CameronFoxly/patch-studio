"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SequenceStep as SequenceStepType } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface Props {
  step: SequenceStepType;
  index: number;
}

export function SequenceStep({ step, index }: Props) {
  const removeStep = useStore((s) => s.removeSequenceStep);
  const updateStep = useStore((s) => s.updateSequenceStep);

  return (
    <div className="flex-shrink-0 w-32 h-24 rounded-lg border bg-background p-2 flex flex-col gap-1">
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
      <Input
        value={step.name}
        onChange={(e) => updateStep(step.id, { name: e.target.value })}
        className="h-6 text-xs"
        placeholder="Step name"
      />
      <Input
        type="number"
        value={step.duration || 0.5}
        onChange={(e) =>
          updateStep(step.id, {
            duration: parseFloat(e.target.value) || 0.5,
          })
        }
        className="h-6 text-xs"
        placeholder="Duration (s)"
        step={0.1}
        min={0.01}
      />
    </div>
  );
}
