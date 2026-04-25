"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SliderInput } from "@/components/ui/slider-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, Effect, EffectType } from "@/lib/types";
import { PlusIcon, XIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

const EFFECT_TYPES: { value: EffectType; label: string }[] = [
  { value: "reverb", label: "Reverb" },
  { value: "delay", label: "Delay" },
  { value: "chorus", label: "Chorus" },
  { value: "phaser", label: "Phaser" },
  { value: "flanger", label: "Flanger" },
  { value: "tremolo", label: "Tremolo" },
  { value: "vibrato", label: "Vibrato" },
  { value: "bitcrusher", label: "Bitcrusher" },
  { value: "compressor", label: "Compressor" },
  { value: "eq", label: "EQ" },
  { value: "distortion", label: "Distortion" },
  { value: "gain", label: "Gain" },
  { value: "pan", label: "Pan" },
  { value: "convolver", label: "Convolver" },
];

function defaultEffect(type: EffectType): Effect {
  const defaults: Record<EffectType, Effect> = {
    reverb: { type: "reverb", decay: 2, mix: 0.3 },
    delay: { type: "delay", time: 0.25, feedback: 0.3, mix: 0.3 },
    chorus: { type: "chorus", rate: 1.5, depth: 0.5, mix: 0.5 },
    phaser: {
      type: "phaser",
      rate: 0.5,
      depth: 0.5,
      stages: 4,
      feedback: 0.3,
      mix: 0.5,
    },
    flanger: { type: "flanger", rate: 0.5, depth: 0.5, feedback: 0.3, mix: 0.5 },
    tremolo: { type: "tremolo", rate: 4, depth: 0.5 },
    vibrato: { type: "vibrato", rate: 5, depth: 0.3 },
    bitcrusher: { type: "bitcrusher", bits: 8, sampleRateReduction: 1, mix: 1 },
    compressor: {
      type: "compressor",
      threshold: -24,
      knee: 30,
      ratio: 12,
      attack: 0.003,
      release: 0.25,
    },
    eq: { type: "eq", bands: [] },
    distortion: { type: "distortion", amount: 50, mix: 0.5 },
    gain: { type: "gain", value: 1 },
    pan: { type: "pan", value: 0 },
    convolver: { type: "convolver", mix: 0.5 },
  };
  return defaults[type];
}

function EffectParams({
  effect,
  onChange,
}: {
  effect: Effect;
  onChange: (e: Effect) => void;
}) {
  const e = effect;
  switch (e.type) {
    case "reverb":
      return (
        <div className="space-y-2">
          <SliderInput label="Decay" value={e.decay ?? 2} min={0.1} max={10} step={0.1} onChange={(v) => onChange({ ...e, decay: v })} />
          <SliderInput label="Pre-Delay" value={e.preDelay ?? 0} min={0} max={0.5} step={0.01} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => onChange({ ...e, preDelay: v })} />
          <SliderInput label="Damping" value={e.damping ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, damping: v })} />
          <SliderInput label="Room Size" value={e.roomSize ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, roomSize: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "delay":
      return (
        <div className="space-y-2">
          <SliderInput label="Time" value={e.time ?? 0.25} min={0.01} max={2} step={0.01} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => onChange({ ...e, time: v })} />
          <SliderInput label="Feedback" value={e.feedback ?? 0.3} min={0} max={0.95} step={0.01} onChange={(v) => onChange({ ...e, feedback: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "chorus":
      return (
        <div className="space-y-2">
          <SliderInput label="Rate" value={e.rate ?? 1.5} min={0.1} max={10} step={0.1} format={(v) => `${v.toFixed(1)} Hz`} onChange={(v) => onChange({ ...e, rate: v })} />
          <SliderInput label="Depth" value={e.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, depth: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "phaser":
      return (
        <div className="space-y-2">
          <SliderInput label="Rate" value={e.rate ?? 0.5} min={0.1} max={10} step={0.1} format={(v) => `${v.toFixed(1)} Hz`} onChange={(v) => onChange({ ...e, rate: v })} />
          <SliderInput label="Depth" value={e.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, depth: v })} />
          <SliderInput label="Stages" value={e.stages ?? 4} min={2} max={12} step={2} format={(v) => `${v}`} onChange={(v) => onChange({ ...e, stages: v })} />
          <SliderInput label="Feedback" value={e.feedback ?? 0.3} min={0} max={0.95} step={0.01} onChange={(v) => onChange({ ...e, feedback: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "flanger":
      return (
        <div className="space-y-2">
          <SliderInput label="Rate" value={e.rate ?? 0.5} min={0.1} max={10} step={0.1} format={(v) => `${v.toFixed(1)} Hz`} onChange={(v) => onChange({ ...e, rate: v })} />
          <SliderInput label="Depth" value={e.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, depth: v })} />
          <SliderInput label="Feedback" value={e.feedback ?? 0.3} min={0} max={0.95} step={0.01} onChange={(v) => onChange({ ...e, feedback: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "tremolo":
      return (
        <div className="space-y-2">
          <SliderInput label="Rate" value={e.rate ?? 4} min={0.1} max={20} step={0.1} format={(v) => `${v.toFixed(1)} Hz`} onChange={(v) => onChange({ ...e, rate: v })} />
          <SliderInput label="Depth" value={e.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, depth: v })} />
        </div>
      );
    case "vibrato":
      return (
        <div className="space-y-2">
          <SliderInput label="Rate" value={e.rate ?? 5} min={0.1} max={20} step={0.1} format={(v) => `${v.toFixed(1)} Hz`} onChange={(v) => onChange({ ...e, rate: v })} />
          <SliderInput label="Depth" value={e.depth ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, depth: v })} />
        </div>
      );
    case "bitcrusher":
      return (
        <div className="space-y-2">
          <SliderInput label="Bits" value={e.bits ?? 8} min={1} max={16} step={1} format={(v) => `${v}`} onChange={(v) => onChange({ ...e, bits: v })} />
          <SliderInput label="Sample Rate Reduction" value={e.sampleRateReduction ?? 1} min={1} max={40} step={1} format={(v) => `${v}x`} onChange={(v) => onChange({ ...e, sampleRateReduction: v })} />
          <SliderInput label="Mix" value={e.mix ?? 1} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "compressor":
      return (
        <div className="space-y-2">
          <SliderInput label="Threshold" value={e.threshold ?? -24} min={-100} max={0} step={1} format={(v) => `${v} dB`} onChange={(v) => onChange({ ...e, threshold: v })} />
          <SliderInput label="Knee" value={e.knee ?? 30} min={0} max={40} step={1} format={(v) => `${v} dB`} onChange={(v) => onChange({ ...e, knee: v })} />
          <SliderInput label="Ratio" value={e.ratio ?? 12} min={1} max={20} step={0.5} format={(v) => `${v}:1`} onChange={(v) => onChange({ ...e, ratio: v })} />
          <SliderInput label="Attack" value={e.attack ?? 0.003} min={0} max={1} step={0.001} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => onChange({ ...e, attack: v })} />
          <SliderInput label="Release" value={e.release ?? 0.25} min={0} max={1} step={0.01} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => onChange({ ...e, release: v })} />
        </div>
      );
    case "distortion":
      return (
        <div className="space-y-2">
          <SliderInput label="Amount" value={e.amount ?? 50} min={0} max={100} step={1} format={(v) => `${v}`} onChange={(v) => onChange({ ...e, amount: v })} />
          <SliderInput label="Mix" value={e.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    case "gain":
      return (
        <div className="space-y-2">
          <SliderInput label="Value" value={e.value ?? 1} min={0} max={2} step={0.01} onChange={(v) => onChange({ ...e, value: v })} />
        </div>
      );
    case "pan":
      return (
        <div className="space-y-2">
          <SliderInput
            label="Pan"
            value={e.value ?? 0}
            min={-1}
            max={1}
            step={0.01}
            format={(v) =>
              v < 0
                ? `L ${Math.abs(v).toFixed(2)}`
                : v > 0
                  ? `R ${v.toFixed(2)}`
                  : "C"
            }
            onChange={(v) => onChange({ ...e, value: v })}
          />
        </div>
      );
    case "eq":
      return (
        <p className="text-xs text-muted-foreground">
          EQ bands configured: {e.bands?.length ?? 0}
        </p>
      );
    case "convolver":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Impulse URL</Label>
            <Input
              type="text"
              placeholder="https://..."
              value={e.url ?? ""}
              onChange={(ev) => onChange({ ...e, url: ev.target.value })}
            />
          </div>
          <SliderInput label="Mix" value={e.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...e, mix: v })} />
        </div>
      );
    default:
      return null;
  }
}

export function EffectsPanel({ layer }: { layer: Layer }) {
  const updateLayerEffects = useStore((s) => s.updateLayerEffects);
  const effects = layer.effects ?? [];
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function setEffects(next: Effect[]) {
    updateLayerEffects(layer.id, next);
  }

  function updateEffect(index: number, updated: Effect) {
    const next = [...effects];
    next[index] = updated;
    setEffects(next);
  }

  function removeEffect(index: number) {
    setEffects(effects.filter((_, i) => i !== index));
    setCollapsed((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addEffect(type: EffectType) {
    setEffects([...effects, defaultEffect(type)]);
  }

  function toggleCollapsed(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  const labelMap = EFFECT_TYPES.reduce(
    (acc, t) => ({ ...acc, [t.value]: t.label }),
    {} as Record<string, string>,
  );

  return (
    <div className="space-y-3">
      {effects.length === 0 && (
        <p className="text-xs text-muted-foreground">No effects in chain</p>
      )}

      {effects.map((effect, i) => (
        <div key={i} className="rounded-md border">
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
                {labelMap[effect.type] ?? effect.type}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                removeEffect(i);
              }}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
          {!collapsed[i] && (
            <div className="px-3 pb-3">
              <EffectParams
                effect={effect}
                onChange={(updated) => updateEffect(i, updated)}
              />
            </div>
          )}
        </div>
      ))}

      <Select
        onValueChange={(v) => {
          if (v) addEffect(v as EffectType);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add effect..." />
        </SelectTrigger>
        <SelectContent>
          {EFFECT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              <PlusIcon className="h-3 w-3 mr-1 inline" />
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
