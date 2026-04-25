"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, LFO, OscillatorType, LFOTarget } from "@/lib/types";
import { PlusIcon, XIcon } from "lucide-react";

function first(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

const LFO_WAVEFORMS: { value: OscillatorType; label: string }[] = [
  { value: "sine", label: "Sine" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
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

export function ModulationPanel({ layer }: { layer: Layer }) {
  const updateLayerLFO = useStore((s) => s.updateLayerLFO);
  const lfos = getLFOs(layer);

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
  }

  function addLFO() {
    setLFOs([...lfos, defaultLFO()]);
  }

  return (
    <div className="space-y-4">
      {lfos.length === 0 && (
        <p className="text-xs text-muted-foreground">No LFOs configured</p>
      )}

      {lfos.map((lfo, i) => (
        <div key={i} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">LFO {i + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeLFO(i)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Waveform</Label>
            <Select
              value={lfo.type}
              onValueChange={(v) => {
                if (v) updateLFO(i, { ...lfo, type: v as OscillatorType });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LFO_WAVEFORMS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Frequency</Label>
              <span className="text-xs text-muted-foreground">
                {lfo.frequency.toFixed(1)} Hz
              </span>
            </div>
            <Slider
              min={0.01}
              max={40}
              step={0.01}
              value={[lfo.frequency]}
              onValueChange={(v) =>
                updateLFO(i, { ...lfo, frequency: first(v) })
              }
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Depth</Label>
              <span className="text-xs text-muted-foreground">
                {lfo.depth.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={1000}
              step={1}
              value={[lfo.depth]}
              onValueChange={(v) => updateLFO(i, { ...lfo, depth: first(v) })}
            />
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full" onClick={addLFO}>
        <PlusIcon className="h-3 w-3 mr-1" />
        Add LFO
      </Button>
    </div>
  );
}
