"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { SliderInput } from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, BiquadFilter, BiquadFilterType } from "@/lib/types";
import { PlusIcon, XIcon } from "lucide-react";

const BIQUAD_TYPES: { value: BiquadFilterType; label: string }[] = [
  { value: "lowpass", label: "Low Pass" },
  { value: "highpass", label: "High Pass" },
  { value: "bandpass", label: "Band Pass" },
  { value: "notch", label: "Notch" },
  { value: "allpass", label: "All Pass" },
  { value: "peaking", label: "Peaking" },
  { value: "lowshelf", label: "Low Shelf" },
  { value: "highshelf", label: "High Shelf" },
];

const GAIN_TYPES: BiquadFilterType[] = ["peaking", "lowshelf", "highshelf"];

function getFilters(layer: Layer): BiquadFilter[] {
  if (!layer.filter) return [];
  const arr = Array.isArray(layer.filter) ? layer.filter : [layer.filter];
  return arr.filter((f): f is BiquadFilter => f.type !== "iir");
}

function defaultFilter(): BiquadFilter {
  return { type: "lowpass", frequency: 1000, resonance: 1 };
}

export function FilterPanel({ layer }: { layer: Layer }) {
  const updateLayerFilter = useStore((s) => s.updateLayerFilter);
  const filters = getFilters(layer);

  function setFilters(next: BiquadFilter[]) {
    if (next.length === 0) {
      updateLayerFilter(layer.id, undefined);
    } else if (next.length === 1) {
      updateLayerFilter(layer.id, next[0]);
    } else {
      updateLayerFilter(layer.id, next);
    }
  }

  function updateFilter(index: number, updated: BiquadFilter) {
    const next = [...filters];
    next[index] = updated;
    setFilters(next);
  }

  function removeFilter(index: number) {
    setFilters(filters.filter((_, i) => i !== index));
  }

  function addFilter() {
    setFilters([...filters, defaultFilter()]);
  }

  return (
    <div className="space-y-4">
      {filters.length === 0 && (
        <p className="text-xs text-muted-foreground">No filters configured</p>
      )}

      {filters.map((filter, i) => (
        <div key={i} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Filter {i + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeFilter(i)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select
              value={filter.type}
              onValueChange={(v) => {
                if (v)
                  updateFilter(i, { ...filter, type: v as BiquadFilterType });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIQUAD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SliderInput
            label="Frequency"
            unit="Hz"
            min={20}
            max={20000}
            step={1}
            value={filter.frequency}
            onChange={(v) => updateFilter(i, { ...filter, frequency: v })}
          />

          <SliderInput
            label="Resonance (Q)"
            min={0.1}
            max={30}
            step={0.1}
            value={filter.resonance ?? 1}
            onChange={(v) => updateFilter(i, { ...filter, resonance: v })}
          />

          {GAIN_TYPES.includes(filter.type) && (
            <SliderInput
              label="Gain"
              unit="dB"
              min={-40}
              max={40}
              step={0.5}
              value={filter.gain ?? 0}
              onChange={(v) => updateFilter(i, { ...filter, gain: v })}
            />
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Filter Envelope</Label>
              <Switch
                checked={!!filter.envelope}
                onCheckedChange={(checked) =>
                  updateFilter(i, {
                    ...filter,
                    envelope: checked
                      ? { attack: 0.01, peak: 2000, decay: 0.3 }
                      : undefined,
                  })
                }
                size="sm"
              />
            </div>
            {filter.envelope && (
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                <SliderInput
                  label="Attack"
                  unit="s"
                  min={0}
                  max={2}
                  step={0.01}
                  value={filter.envelope.attack}
                  onChange={(v) =>
                    updateFilter(i, {
                      ...filter,
                      envelope: { ...filter.envelope!, attack: v },
                    })
                  }
                />
                <SliderInput
                  label="Peak"
                  unit="Hz"
                  min={20}
                  max={20000}
                  step={1}
                  value={filter.envelope.peak}
                  onChange={(v) =>
                    updateFilter(i, {
                      ...filter,
                      envelope: { ...filter.envelope!, peak: v },
                    })
                  }
                />
                <SliderInput
                  label="Decay"
                  unit="s"
                  min={0}
                  max={5}
                  step={0.01}
                  value={filter.envelope.decay}
                  onChange={(v) =>
                    updateFilter(i, {
                      ...filter,
                      envelope: { ...filter.envelope!, decay: v },
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addFilter}
      >
        <PlusIcon className="h-3 w-3 mr-1" />
        Add Filter
      </Button>
    </div>
  );
}
