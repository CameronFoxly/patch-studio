"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SliderInput } from "@/components/ui/slider-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Layer,
  Source,
  OscillatorSource,
  NoiseSource,
  WavetableSource,
  OscillatorType,
  NoiseColor,
} from "@/lib/types";

const SOURCE_MODES = [
  { value: "oscillator", label: "Oscillator" },
  { value: "noise", label: "Noise" },
  { value: "wavetable", label: "Wavetable" },
] as const;

const WAVEFORMS: OscillatorType[] = ["sine", "triangle", "square", "sawtooth"];
const NOISE_COLORS: NoiseColor[] = ["white", "pink", "brown"];

function getSourceMode(source: Source): string {
  if (source.type === "noise") return "noise";
  if (source.type === "wavetable") return "wavetable";
  return "oscillator";
}

export function SourcePanel({ layer }: { layer: Layer }) {
  const updateLayerSource = useStore((s) => s.updateLayerSource);
  const source = layer.source;
  const mode = getSourceMode(source);

  function setSource(next: Source) {
    updateLayerSource(layer.id, next);
  }

  function handleModeChange(nextMode: string | null) {
    if (!nextMode || nextMode === mode) return;
    if (nextMode === "oscillator") {
      setSource({ type: "sine", frequency: 440 });
    } else if (nextMode === "noise") {
      setSource({ type: "noise", color: "white" });
    } else {
      setSource({
        type: "wavetable",
        harmonics: [1, 0.5, 0.25],
        frequency: 440,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Mode</Label>
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {mode === "oscillator" && (
        <OscillatorControls
          source={source as OscillatorSource}
          onChange={setSource}
        />
      )}
      {mode === "noise" && (
        <NoiseControls source={source as NoiseSource} onChange={setSource} />
      )}
      {mode === "wavetable" && (
        <WavetableControls
          source={source as WavetableSource}
          onChange={setSource}
        />
      )}
    </div>
  );
}

function OscillatorControls({
  source,
  onChange,
}: {
  source: OscillatorSource;
  onChange: (s: Source) => void;
}) {
  const freq =
    typeof source.frequency === "number"
      ? source.frequency
      : source.frequency.start;
  const hasFM = !!source.fm;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Waveform</Label>
        <Select
          value={source.type}
          onValueChange={(v) => {
            if (v) onChange({ ...source, type: v as OscillatorType });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WAVEFORMS.map((w) => (
              <SelectItem key={w} value={w}>
                {w.charAt(0).toUpperCase() + w.slice(1)}
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
        value={freq}
        onChange={(v) => onChange({ ...source, frequency: v })}
      />

      <SliderInput
        label="Detune"
        unit="¢"
        min={-1200}
        max={1200}
        step={1}
        value={source.detune ?? 0}
        onChange={(v) => onChange({ ...source, detune: v })}
      />

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-xs">FM Synthesis</Label>
        <Switch
          checked={hasFM}
          onCheckedChange={(checked) =>
            onChange({
              ...source,
              fm: checked ? { ratio: 2, depth: 100 } : undefined,
            })
          }
          size="sm"
        />
      </div>

      {source.fm && (
        <div className="space-y-3 pl-2 border-l-2 border-muted">
          <SliderInput
            label="Ratio"
            min={0.1}
            max={16}
            step={0.1}
            value={source.fm.ratio}
            onChange={(v) =>
              onChange({ ...source, fm: { ...source.fm!, ratio: v } })
            }
          />
          <SliderInput
            label="Depth"
            min={0}
            max={1000}
            step={1}
            value={source.fm.depth}
            onChange={(v) =>
              onChange({ ...source, fm: { ...source.fm!, depth: v } })
            }
          />
        </div>
      )}
    </div>
  );
}

function NoiseControls({
  source,
  onChange,
}: {
  source: NoiseSource;
  onChange: (s: Source) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Color</Label>
      <Select
        value={source.color ?? "white"}
        onValueChange={(v) => {
          if (v) onChange({ ...source, color: v as NoiseColor });
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NOISE_COLORS.map((c) => (
            <SelectItem key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function WavetableControls({
  source,
  onChange,
}: {
  source: WavetableSource;
  onChange: (s: Source) => void;
}) {
  return (
    <div className="space-y-4">
      <SliderInput
        label="Frequency"
        unit="Hz"
        min={20}
        max={20000}
        step={1}
        value={source.frequency}
        onChange={(v) => onChange({ ...source, frequency: v })}
      />
      <div className="space-y-2">
        <Label className="text-xs">Harmonics (comma-separated)</Label>
        <Input
          type="text"
          value={source.harmonics.join(", ")}
          onChange={(e) => {
            const harmonics = e.target.value
              .split(",")
              .map((s) => parseFloat(s.trim()))
              .filter((n) => !isNaN(n));
            if (harmonics.length > 0) {
              onChange({ ...source, harmonics });
            }
          }}
        />
        <span className="text-xs text-muted-foreground">
          {source.harmonics.length} harmonics
        </span>
      </div>
    </div>
  );
}
