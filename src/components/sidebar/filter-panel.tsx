"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { RotaryKnob } from "@/components/ui/rotary-knob";
import { KnobRow } from "@/components/ui/knob-row";
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
import type { Layer, BiquadFilter, IIRFilter, Filter, BiquadFilterType } from "@/lib/types";
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

function getFilters(layer: Layer): Filter[] {
  if (!layer.filter) return [];
  return Array.isArray(layer.filter) ? layer.filter : [layer.filter];
}

function getBiquadFilters(layer: Layer): BiquadFilter[] {
  return getFilters(layer).filter((f): f is BiquadFilter => f.type !== "iir");
}

function defaultFilter(): BiquadFilter {
  return { type: "lowpass", frequency: 1000, resonance: 1 };
}

function defaultIIRFilter(): IIRFilter {
  return { type: "iir", feedforward: [1, 0], feedback: [1, 0] };
}

/* ── IIR Filter Coefficient Editor ── */

function IIRCoefficientEditor({
  label,
  coefficients,
  onChange,
}: {
  label: string;
  coefficients: number[];
  onChange: (coeffs: number[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onChange([...coefficients, 0])}
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            disabled={coefficients.length <= 1}
            onClick={() => onChange(coefficients.slice(0, -1))}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {coefficients.map((coeff, i) => (
          <input
            key={i}
            type="number"
            value={coeff}
            step={0.01}
            onChange={(e) => {
              const next = [...coefficients];
              next[i] = parseFloat(e.target.value) || 0;
              onChange(next);
            }}
            className="w-16 h-6 text-[10px] rounded border bg-background px-1.5 text-center tabular-nums"
            title={`Coefficient ${i}`}
          />
        ))}
      </div>
    </div>
  );
}

function IIRFilterControls({
  filter,
  onChange,
}: {
  filter: IIRFilter;
  onChange: (f: IIRFilter) => void;
}) {
  return (
    <div className="space-y-3">
      <IIRCoefficientEditor
        label="Feedforward (b)"
        coefficients={filter.feedforward}
        onChange={(feedforward) => onChange({ ...filter, feedforward })}
      />
      <IIRCoefficientEditor
        label="Feedback (a)"
        coefficients={filter.feedback}
        onChange={(feedback) => onChange({ ...filter, feedback })}
      />
      <p className="text-[10px] text-muted-foreground">
        H(z) = (b₀ + b₁z⁻¹ + …) / (a₀ + a₁z⁻¹ + …)
      </p>
    </div>
  );
}

export function FilterPanel({ layer }: { layer: Layer }) {
  const updateLayerFilter = useStore((s) => s.updateLayerFilter);
  const allFilters = getFilters(layer);
  const biquadFilters = getBiquadFilters(layer);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    allFilters.length > 0 ? 0 : null
  );

  function setAllFilters(next: Filter[]) {
    if (next.length === 0) {
      updateLayerFilter(layer.id, undefined);
    } else if (next.length === 1) {
      updateLayerFilter(layer.id, next[0]);
    } else {
      updateLayerFilter(layer.id, next);
    }
  }

  function updateFilter(index: number, updated: Filter) {
    const next = [...allFilters];
    next[index] = updated;
    setAllFilters(next);
  }

  function removeFilter(index: number) {
    setAllFilters(allFilters.filter((_, i) => i !== index));
    if (selectedIndex === index) {
      setSelectedIndex(allFilters.length > 1 ? Math.max(0, index - 1) : null);
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  }

  function addBiquadFilter() {
    const newFilters = [...allFilters, defaultFilter()];
    setAllFilters(newFilters);
    setSelectedIndex(newFilters.length - 1);
  }

  function addIIR() {
    const newFilters = [...allFilters, defaultIIRFilter()];
    setAllFilters(newFilters);
    setSelectedIndex(newFilters.length - 1);
  }

  const selected = selectedIndex !== null ? allFilters[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {/* EQ Graph — only shows biquad filters */}
      <FilterGraph
        filters={biquadFilters}
        selectedIndex={
          selectedIndex !== null && allFilters[selectedIndex]?.type !== "iir"
            ? biquadFilters.indexOf(allFilters[selectedIndex] as BiquadFilter)
            : null
        }
        source={layer.source}
        onSelectFilter={(biqIdx) => {
          // Map biquad index back to allFilters index
          if (biqIdx === null) { setSelectedIndex(null); return; }
          const biquad = biquadFilters[biqIdx];
          const allIdx = allFilters.indexOf(biquad);
          setSelectedIndex(allIdx >= 0 ? allIdx : null);
        }}
        onUpdateFilter={(biqIdx, updated) => {
          const biquad = biquadFilters[biqIdx];
          const allIdx = allFilters.indexOf(biquad);
          if (allIdx >= 0) updateFilter(allIdx, updated);
        }}
      />

      {/* Selected filter controls */}
      {selected && selectedIndex !== null && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              {selected.type === "iir" ? "IIR Filter" : `Filter ${selectedIndex + 1}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeFilter(selectedIndex)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>

          {selected.type === "iir" ? (
            <IIRFilterControls
              filter={selected as IIRFilter}
              onChange={(f) => updateFilter(selectedIndex, f)}
            />
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select
                  value={selected.type}
                  onValueChange={(v) => {
                    if (v)
                      updateFilter(selectedIndex, { ...(selected as BiquadFilter), type: v as BiquadFilterType });
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

              <KnobRow>
                <RotaryKnob
                  label="Frequency"
                  unit="Hz"
                  min={20}
                  max={20000}
                  step={1}
                  value={(selected as BiquadFilter).frequency}
                  onChange={(v) => updateFilter(selectedIndex, { ...(selected as BiquadFilter), frequency: v })}
                />

                <RotaryKnob
                  label="Q"
                  min={0.1}
                  max={30}
                  step={0.1}
                  value={(selected as BiquadFilter).resonance ?? 1}
                  onChange={(v) => updateFilter(selectedIndex, { ...(selected as BiquadFilter), resonance: v })}
                />

                {GAIN_TYPES.includes((selected as BiquadFilter).type) && (
                  <RotaryKnob
                    label="Gain"
                    unit="dB"
                    min={-40}
                    max={40}
                    step={0.5}
                    value={(selected as BiquadFilter).gain ?? 0}
                    onChange={(v) => updateFilter(selectedIndex, { ...(selected as BiquadFilter), gain: v })}
                  />
                )}
              </KnobRow>

              <Separator className="-mx-3 data-horizontal:w-auto" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Filter Envelope</Label>
                  <Switch
                    checked={!!(selected as BiquadFilter).envelope}
                    onCheckedChange={(checked) =>
                      updateFilter(selectedIndex, {
                        ...(selected as BiquadFilter),
                        envelope: checked
                          ? { attack: 0.01, peak: 2000, decay: 0.3 }
                          : undefined,
                      })
                    }
                    size="sm"
                  />
                </div>
                {(selected as BiquadFilter).envelope && (
                  <div className="pl-2 border-l-2 border-muted">
                    <KnobRow>
                      <RotaryKnob
                        label="Attack"
                        unit="s"
                        min={0}
                        max={2}
                        step={0.01}
                        value={(selected as BiquadFilter).envelope!.attack}
                        onChange={(v) =>
                          updateFilter(selectedIndex, {
                            ...(selected as BiquadFilter),
                            envelope: { ...(selected as BiquadFilter).envelope!, attack: v },
                          })
                        }
                      />
                      <RotaryKnob
                        label="Peak"
                        unit="Hz"
                        min={20}
                        max={20000}
                        step={1}
                        value={(selected as BiquadFilter).envelope!.peak}
                        onChange={(v) =>
                          updateFilter(selectedIndex, {
                            ...(selected as BiquadFilter),
                            envelope: { ...(selected as BiquadFilter).envelope!, peak: v },
                          })
                        }
                      />
                      <RotaryKnob
                        label="Decay"
                        unit="s"
                        min={0}
                        max={5}
                        step={0.01}
                        value={(selected as BiquadFilter).envelope!.decay}
                        onChange={(v) =>
                          updateFilter(selectedIndex, {
                            ...(selected as BiquadFilter),
                            envelope: { ...(selected as BiquadFilter).envelope!, decay: v },
                          })
                        }
                      />
                    </KnobRow>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter list (chips for multi-filter) */}
      {allFilters.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {allFilters.map((f, i) => (
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
              {i + 1}: {f.type === "iir" ? "IIR" : (BIQUAD_TYPES.find((t) => t.value === f.type)?.label ?? f.type)}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={addBiquadFilter}
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          Biquad
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={addIIR}
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          IIR
        </Button>
      </div>
    </div>
  );
}
