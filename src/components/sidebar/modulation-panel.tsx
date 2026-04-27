"use client";

import { useStore } from "@/lib/store";
import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotaryKnob } from "@/components/ui/rotary-knob";
import { KnobRow } from "@/components/ui/knob-row";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, LFO, OscillatorType, LFOTarget } from "@/lib/types";
import { PlusIcon, XIcon, PowerIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

/* ── SVG wave shape icons for LFO waveforms ── */

function WaveIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 40 20" className="w-full h-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const WAVE_PATHS: Record<string, string> = {
  sine: "M 0 10 Q 5 0, 10 10 Q 15 20, 20 10 Q 25 0, 30 10 Q 35 20, 40 10",
  triangle: "M 0 10 L 5 2 L 15 18 L 25 2 L 35 18 L 40 10",
  square: "M 0 15 L 0 5 L 10 5 L 10 15 L 20 15 L 20 5 L 30 5 L 30 15 L 40 15",
  sawtooth: "M 0 15 L 10 5 L 10 15 L 20 5 L 20 15 L 30 5 L 30 15 L 40 5",
};

const LFO_WAVEFORM_OPTIONS: { value: OscillatorType; label: string; icon: React.ReactNode }[] = [
  { value: "sine", label: "Sine", icon: <WaveIcon d={WAVE_PATHS.sine} /> },
  { value: "triangle", label: "Triangle", icon: <WaveIcon d={WAVE_PATHS.triangle} /> },
  { value: "square", label: "Square", icon: <WaveIcon d={WAVE_PATHS.square} /> },
  { value: "sawtooth", label: "Saw", icon: <WaveIcon d={WAVE_PATHS.sawtooth} /> },
];

const LFO_TARGETS: { value: LFOTarget; label: string }[] = [
  { value: "frequency", label: "Frequency" },
  { value: "detune", label: "Detune" },
  { value: "gain", label: "Gain" },
  { value: "pan", label: "Pan" },
  { value: "filter.frequency", label: "Filter Freq" },
  { value: "filter.detune", label: "Filter Detune" },
  { value: "filter.Q", label: "Filter Q" },
  { value: "filter.gain", label: "Filter Gain" },
  { value: "playbackRate", label: "Playback Rate" },
];

function getLFOs(layer: Layer): LFO[] {
  if (!layer.lfo) return [];
  return Array.isArray(layer.lfo) ? layer.lfo : [layer.lfo];
}

function defaultLFO(): LFO {
  return { type: "sine", frequency: 4, depth: 50, target: "frequency" };
}

function lfoLabel(lfo: LFO): string {
  const target = LFO_TARGETS.find((t) => t.value === lfo.target)?.label ?? lfo.target;
  return `${lfo.type.charAt(0).toUpperCase() + lfo.type.slice(1)} → ${target}`;
}

export function ModulationPanel({ layer }: { layer: Layer }) {
  const updateLayerLFO = useStore((s) => s.updateLayerLFO);
  const toggleLayerLFOBypass = useStore((s) => s.toggleLayerLFOBypass);
  const setLfoInteractionLayerId = useStore((s) => s.setLfoInteractionLayerId);
  const lfos = getLFOs(layer);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const handleLfoDragStart = useCallback(() => {
    setLfoInteractionLayerId(layer.id);
  }, [layer.id, setLfoInteractionLayerId]);

  const handleLfoDragEnd = useCallback(() => {
    setLfoInteractionLayerId(null);
  }, [setLfoInteractionLayerId]);

  function setLFOs(next: LFO[]) {
    if (next.length === 0) {
      updateLayerLFO(layer.id, undefined);
    } else if (next.length === 1) {
      updateLayerLFO(layer.id, next[0]);
    } else {
      updateLayerLFO(layer.id, next);
    }
  }

  function updateLFO(index: number, updated: LFO) {
    const next = [...lfos];
    next[index] = updated;
    setLFOs(next);
  }

  function removeLFO(index: number) {
    setLFOs(lfos.filter((_, i) => i !== index));
    setCollapsed((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addLFO() {
    setLFOs([...lfos, defaultLFO()]);
  }

  function toggleCollapsed(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="space-y-3">
      {lfos.length === 0 && (
        <p className="text-xs text-muted-foreground">No LFOs configured</p>
      )}

      {lfos.map((lfo, i) => (
        <div key={i} className={`rounded-md border ${lfo.bypassed ? "opacity-50" : ""}`}>
          <div
            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50"
            onClick={() => toggleCollapsed(i)}
          >
            <div className="flex items-center gap-1.5">
              {collapsed[i] ? (
                <ChevronRightIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
              <span className="text-xs font-medium">
                {lfoLabel(lfo)}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant={lfo.bypassed ? "outline" : "ghost"}
                size="icon"
                className={`h-6 w-6 ${lfo.bypassed ? "text-muted-foreground" : "text-primary"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLFOBypass(layer.id, i);
                }}
                title={lfo.bypassed ? "Enable LFO" : "Bypass LFO"}
              >
                <PowerIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLFO(i);
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {!collapsed[i] && (
            <div className="px-3 pb-3 space-y-3">
              <ToggleGroup
                label="Waveform"
                options={LFO_WAVEFORM_OPTIONS}
                value={lfo.type}
                onChange={(v) => updateLFO(i, { ...lfo, type: v })}
              />

              <div className="space-y-2">
                <Label className="text-xs">Target</Label>
                <Select
                  value={lfo.target}
                  onValueChange={(v) => {
                    if (v) updateLFO(i, { ...lfo, target: v as LFOTarget });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LFO_TARGETS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <KnobRow>
                <RotaryKnob
                  label="Frequency"
                  unit="Hz"
                  min={0.01}
                  max={40}
                  step={0.01}
                  value={lfo.frequency}
                  onChange={(v) => updateLFO(i, { ...lfo, frequency: v })}
                  onDragStart={handleLfoDragStart}
                  onDragEnd={handleLfoDragEnd}
                />
                <RotaryKnob
                  label="Depth"
                  min={0}
                  max={1000}
                  step={1}
                  value={lfo.depth}
                  onChange={(v) => updateLFO(i, { ...lfo, depth: v })}
                  onDragStart={handleLfoDragStart}
                  onDragEnd={handleLfoDragEnd}
                />
              </KnobRow>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full" onClick={addLFO}>
        <PlusIcon className="h-3 w-3 mr-1" />
        Add LFO
      </Button>
    </div>
  );
}
