"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SliderInput } from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { PianoKeyboardDialog } from "@/components/ui/piano-keyboard";
import { Piano } from "lucide-react";
import type {
  Layer,
  Source,
  OscillatorSource,
  NoiseSource,
  WavetableSource,
  OscillatorType,
  NoiseColor,
} from "@/lib/types";

/* ── SVG wave shape icons ── */

function WaveIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 20" className={`w-full h-full ${className ?? ""}`} preserveAspectRatio="none">
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

function NoiseIcon({ density }: { density: "high" | "mid" | "low" }) {
  const seeds = density === "high"
    ? [2, 8, 4, 14, 6, 10, 3, 16, 7, 12, 5, 9, 15, 4, 11, 8, 13, 6, 10, 3]
    : density === "mid"
      ? [4, 10, 6, 14, 8, 12, 5, 15, 7, 11, 9, 13, 6, 10, 8, 12, 5, 14, 7, 11]
      : [6, 11, 8, 12, 9, 11, 7, 13, 10, 12, 8, 10, 11, 9, 12, 8, 11, 10, 9, 11];
  const pts = seeds.map((y, i) => `${(i / (seeds.length - 1)) * 40},${y}`).join(" ");
  return (
    <svg viewBox="0 0 40 20" className="w-full h-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function WavetableIcon() {
  return (
    <svg viewBox="0 0 40 20" className="w-full h-full" preserveAspectRatio="none">
      <path d="M 0 10 Q 3 3, 8 10 Q 11 14, 14 10 L 16 6 L 18 14 L 20 10 Q 24 2, 28 10 Q 31 16, 34 10 Q 37 5, 40 10" fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ── Toggle button group ── */

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; icon: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors cursor-pointer ${
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            }`}
          >
            <div className="h-5 w-full px-0.5">{opt.icon}</div>
            <span className="text-[10px] leading-none">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Mode / waveform / noise option configs ── */

const MODE_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "oscillator", label: "Oscillator", icon: <WaveIcon d={WAVE_PATHS.sine} /> },
  { value: "noise", label: "Noise", icon: <NoiseIcon density="high" /> },
  { value: "wavetable", label: "Wavetable", icon: <WavetableIcon /> },
];

const WAVEFORM_OPTIONS: { value: OscillatorType; label: string; icon: React.ReactNode }[] = [
  { value: "sine", label: "Sine", icon: <WaveIcon d={WAVE_PATHS.sine} /> },
  { value: "triangle", label: "Triangle", icon: <WaveIcon d={WAVE_PATHS.triangle} /> },
  { value: "square", label: "Square", icon: <WaveIcon d={WAVE_PATHS.square} /> },
  { value: "sawtooth", label: "Saw", icon: <WaveIcon d={WAVE_PATHS.sawtooth} /> },
];

const NOISE_OPTIONS: { value: NoiseColor; label: string; icon: React.ReactNode }[] = [
  { value: "white", label: "White", icon: <NoiseIcon density="high" /> },
  { value: "pink", label: "Pink", icon: <NoiseIcon density="mid" /> },
  { value: "brown", label: "Brown", icon: <NoiseIcon density="low" /> },
];

/* ── Components ── */

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

  function handleModeChange(nextMode: string) {
    if (nextMode === mode) return;
    if (nextMode === "oscillator") {
      setSource({ type: "sine", frequency: 440 });
    } else if (nextMode === "noise") {
      setSource({ type: "noise", color: "white" });
    } else {
      setSource({ type: "wavetable", harmonics: [1, 0.5, 0.25], frequency: 440 });
    }
  }

  return (
    <div className="space-y-4">
      <ToggleGroup label="Mode" options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />

      <Separator />

      {mode === "oscillator" && (
        <OscillatorControls source={source as OscillatorSource} onChange={setSource} />
      )}
      {mode === "noise" && (
        <NoiseControls source={source as NoiseSource} onChange={setSource} />
      )}
      {mode === "wavetable" && (
        <WavetableControls source={source as WavetableSource} onChange={setSource} />
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
  const [pianoOpen, setPianoOpen] = useState(false);
  const freq =
    typeof source.frequency === "number"
      ? source.frequency
      : source.frequency.start;
  const hasFM = !!source.fm;

  return (
    <div className="space-y-4">
      <ToggleGroup
        label="Waveform"
        options={WAVEFORM_OPTIONS}
        value={source.type}
        onChange={(v) => onChange({ ...source, type: v })}
      />

      <SliderInput
        label="Frequency"
        unit="Hz"
        min={20}
        max={20000}
        step={1}
        value={freq}
        onChange={(v) => onChange({ ...source, frequency: v })}
        action={
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setPianoOpen(!pianoOpen)}
            title="Note picker"
          >
            <Piano className="size-3" />
          </Button>
        }
      />

      <PianoKeyboardDialog
        open={pianoOpen}
        onClose={() => setPianoOpen(false)}
        currentFrequency={freq}
        onNoteSelect={(v) => onChange({ ...source, frequency: v })}
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
    <ToggleGroup
      label="Color"
      options={NOISE_OPTIONS}
      value={source.color ?? "white"}
      onChange={(v) => onChange({ ...source, color: v })}
    />
  );
}

function WavetableControls({
  source,
  onChange,
}: {
  source: WavetableSource;
  onChange: (s: Source) => void;
}) {
  const [pianoOpen, setPianoOpen] = useState(false);

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
        action={
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setPianoOpen(!pianoOpen)}
            title="Note picker"
          >
            <Piano className="size-3" />
          </Button>
        }
      />

      <PianoKeyboardDialog
        open={pianoOpen}
        onClose={() => setPianoOpen(false)}
        currentFrequency={source.frequency}
        onNoteSelect={(v) => onChange({ ...source, frequency: v })}
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
