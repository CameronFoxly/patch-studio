"use client";

import { useState } from "react";
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
import { FilterGraph } from "./filter-graph";
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    filters.length > 0 ? 0 : null
  );

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
    if (selectedIndex === index) {
      setSelectedIndex(filters.length > 1 ? Math.max(0, index - 1) : null);
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  }

  function addFilter() {
    const newFilters = [...filters, defaultFilter()];
    setFilters(newFilters);
    setSelectedIndex(newFilters.length - 1);
  }

  const selected = selectedIndex !== null ? filters[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {/* EQ Graph */}
      <FilterGraph
        filters={filters}
        selectedIndex={selectedIndex}
        source={layer.source}
        onSelectFilter={setSelectedIndex}
        onUpdateFilter={updateFilter}
      />

      {/* Selected filter controls */}
      {selected && selectedIndex !== null && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Filter {selectedIndex + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeFilter(selectedIndex)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select
              value={selected.type}
              onValueChange={(v) => {
                if (v)
                  updateFilter(selectedIndex, { ...selected, type: v as BiquadFilterType });
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
            value={selected.frequency}
            onChange={(v) => updateFilter(selectedIndex, { ...selected, frequency: v })}
          />

          <SliderInput
            label="Resonance (Q)"
            min={0.1}
            max={30}
            step={0.1}
            value={selected.resonance ?? 1}
            onChange={(v) => updateFilter(selectedIndex, { ...selected, resonance: v })}
          />

          {GAIN_TYPES.includes(selected.type) && (
            <SliderInput
              label="Gain"
              unit="dB"
              min={-40}
              max={40}
              step={0.5}
              value={selected.gain ?? 0}
              onChange={(v) => updateFilter(selectedIndex, { ...selected, gain: v })}
            />
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Filter Envelope</Label>
              <Switch
                checked={!!selected.envelope}
                onCheckedChange={(checked) =>
                  updateFilter(selectedIndex, {
                    ...selected,
                    envelope: checked
                      ? { attack: 0.01, peak: 2000, decay: 0.3 }
                      : undefined,
                  })
                }
                size="sm"
              />
            </div>
            {selected.envelope && (
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                <SliderInput
                  label="Attack"
                  unit="s"
                  min={0}
                  max={2}
                  step={0.01}
                  value={selected.envelope.attack}
                  onChange={(v) =>
                    updateFilter(selectedIndex, {
                      ...selected,
                      envelope: { ...selected.envelope!, attack: v },
                    })
                  }
                />
                <SliderInput
                  label="Peak"
                  unit="Hz"
                  min={20}
                  max={20000}
                  step={1}
                  value={selected.envelope.peak}
                  onChange={(v) =>
                    updateFilter(selectedIndex, {
                      ...selected,
                      envelope: { ...selected.envelope!, peak: v },
                    })
                  }
                />
                <SliderInput
                  label="Decay"
                  unit="s"
                  min={0}
                  max={5}
                  step={0.01}
                  value={selected.envelope.decay}
                  onChange={(v) =>
                    updateFilter(selectedIndex, {
                      ...selected,
                      envelope: { ...selected.envelope!, decay: v },
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter list (chips for multi-filter) */}
      {filters.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedIndex === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {i + 1}: {BIQUAD_TYPES.find((t) => t.value === f.type)?.label ?? f.type}
            </button>
          ))}
        </div>
      )}

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
