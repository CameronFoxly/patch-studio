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
import { PlusIcon, XIcon, PowerIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

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

function filterLabel(f: Filter): string {
  if (f.type === "iir") return "IIR Filter";
  return BIQUAD_TYPES.find((t) => t.value === f.type)?.label ?? f.type;
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

function BiquadFilterControls({
  filter,
  index,
  onChange,
}: {
  filter: BiquadFilter;
  index: number;
  onChange: (index: number, updated: Filter) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Type</Label>
        <Select
          value={filter.type}
          onValueChange={(v) => {
            if (v) onChange(index, { ...filter, type: v as BiquadFilterType });
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
          value={filter.frequency}
          onChange={(v) => onChange(index, { ...filter, frequency: v })}
        />
        <RotaryKnob
          label="Q"
          min={0.1}
          max={30}
          step={0.1}
          value={filter.resonance ?? 1}
          onChange={(v) => onChange(index, { ...filter, resonance: v })}
        />
        {GAIN_TYPES.includes(filter.type) && (
          <RotaryKnob
            label="Gain"
            unit="dB"
            min={-40}
            max={40}
            step={0.5}
            value={filter.gain ?? 0}
            onChange={(v) => onChange(index, { ...filter, gain: v })}
          />
        )}
      </KnobRow>

      <Separator className="-mx-3 data-horizontal:w-auto" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Filter Envelope</Label>
          <Switch
            checked={!!filter.envelope}
            onCheckedChange={(checked) =>
              onChange(index, {
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
          <div className="pl-2 border-l-2 border-muted">
            <KnobRow>
              <RotaryKnob
                label="Attack"
                unit="s"
                min={0}
                max={2}
                step={0.01}
                value={filter.envelope.attack}
                onChange={(v) =>
                  onChange(index, {
                    ...filter,
                    envelope: { ...filter.envelope!, attack: v },
                  })
                }
              />
              <RotaryKnob
                label="Peak"
                unit="Hz"
                min={20}
                max={20000}
                step={1}
                value={filter.envelope.peak}
                onChange={(v) =>
                  onChange(index, {
                    ...filter,
                    envelope: { ...filter.envelope!, peak: v },
                  })
                }
              />
              <RotaryKnob
                label="Decay"
                unit="s"
                min={0}
                max={5}
                step={0.01}
                value={filter.envelope.decay}
                onChange={(v) =>
                  onChange(index, {
                    ...filter,
                    envelope: { ...filter.envelope!, decay: v },
                  })
                }
              />
            </KnobRow>
          </div>
        )}
      </div>
    </>
  );
}

export function FilterPanel({ layer }: { layer: Layer }) {
  const updateLayerFilter = useStore((s) => s.updateLayerFilter);
  const toggleLayerFilterBypass = useStore((s) => s.toggleLayerFilterBypass);
  const allFilters = getFilters(layer);
  const biquadFilters = getBiquadFilters(layer);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

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
    setCollapsed((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addBiquadFilter() {
    setAllFilters([...allFilters, defaultFilter()]);
  }

  function addIIR() {
    setAllFilters([...allFilters, defaultIIRFilter()]);
  }

  function toggleCollapsed(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  // Map a biquad-only index from the graph back to allFilters index
  function biquadToAllIndex(biqIdx: number): number {
    const biquad = biquadFilters[biqIdx];
    return allFilters.indexOf(biquad);
  }

  return (
    <div className="space-y-4">
      {/* EQ Graph — only shows non-bypassed biquad filters */}
      <FilterGraph
        filters={biquadFilters.filter((f) => !f.bypassed)}
        selectedIndex={null}
        source={layer.source}
        onSelectFilter={() => {}}
        onUpdateFilter={(biqIdx, updated) => {
          const activeBiquads = biquadFilters.filter((f) => !f.bypassed);
          const biquad = activeBiquads[biqIdx];
          const allIdx = allFilters.indexOf(biquad);
          if (allIdx >= 0) updateFilter(allIdx, updated);
        }}
      />

      {allFilters.length === 0 && (
        <p className="text-xs text-muted-foreground">No filters in chain</p>
      )}

      {/* Filter list — collapsible cards like effects */}
      {allFilters.map((filter, i) => (
        <div key={i} className={`rounded-md border ${filter.bypassed ? "opacity-50" : ""}`}>
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
                {filterLabel(filter)}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant={filter.bypassed ? "outline" : "ghost"}
                size="icon"
                className={`h-6 w-6 ${filter.bypassed ? "text-muted-foreground" : "text-primary"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerFilterBypass(layer.id, i);
                }}
                title={filter.bypassed ? "Enable filter" : "Bypass filter"}
              >
                <PowerIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFilter(i);
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {!collapsed[i] && (
            <div className="px-3 pb-3 space-y-3">
              {filter.type === "iir" ? (
                <IIRFilterControls
                  filter={filter as IIRFilter}
                  onChange={(f) => updateFilter(i, f)}
                />
              ) : (
                <BiquadFilterControls
                  filter={filter as BiquadFilter}
                  index={i}
                  onChange={updateFilter}
                />
              )}
            </div>
          )}
        </div>
      ))}

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
