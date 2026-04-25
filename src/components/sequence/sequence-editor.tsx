"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SequenceStep } from "./sequence-step";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

export function SequenceEditor() {
  const showSequenceEditor = useStore((s) => s.showSequenceEditor);
  const toggleSequenceEditor = useStore((s) => s.toggleSequenceEditor);
  const steps = useStore((s) => s.sequenceSteps);
  const addStep = useStore((s) => s.addSequenceStep);

  return (
    <div className="border-t bg-card">
      <button
        onClick={toggleSequenceEditor}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span>Sequence Editor ({steps.length} steps)</span>
        {showSequenceEditor ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {showSequenceEditor && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <SequenceStep key={step.id} step={step} index={i} />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-24 w-24 flex-col gap-1"
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
