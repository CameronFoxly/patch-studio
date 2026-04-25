"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, Panner3D, PanningModel, DistanceModel } from "@/lib/types";

function first(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

const PANNING_MODELS: PanningModel[] = ["equalpower", "HRTF"];
const DISTANCE_MODELS: DistanceModel[] = ["linear", "inverse", "exponential"];

function defaultPanner(): Panner3D {
  return {
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    panningModel: "HRTF",
    distanceModel: "inverse",
    refDistance: 1,
    maxDistance: 10000,
    rolloffFactor: 1,
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
  };
}

function NumericField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step ?? 0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function SpatialPanel({ layer }: { layer: Layer }) {
  const updateLayerPanner = useStore((s) => s.updateLayerPanner);
  const enabled = !!layer.panner;
  const panner = layer.panner ?? defaultPanner();

  function update(partial: Partial<Panner3D>) {
    updateLayerPanner(layer.id, { ...panner, ...partial });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">3D Panner</Label>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            updateLayerPanner(layer.id, checked ? defaultPanner() : undefined)
          }
          size="sm"
        />
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Position</Label>
            <div className="grid grid-cols-3 gap-2">
              <NumericField
                label="X"
                value={panner.positionX ?? 0}
                onChange={(v) => update({ positionX: v })}
              />
              <NumericField
                label="Y"
                value={panner.positionY ?? 0}
                onChange={(v) => update({ positionY: v })}
              />
              <NumericField
                label="Z"
                value={panner.positionZ ?? 0}
                onChange={(v) => update({ positionZ: v })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs">Panning Model</Label>
            <Select
              value={panner.panningModel ?? "HRTF"}
              onValueChange={(v) => {
                if (v) update({ panningModel: v as PanningModel });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PANNING_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Distance Model</Label>
            <Select
              value={panner.distanceModel ?? "inverse"}
              onValueChange={(v) => {
                if (v) update({ distanceModel: v as DistanceModel });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <NumericField
              label="Ref Distance"
              value={panner.refDistance ?? 1}
              min={0}
              step={0.1}
              onChange={(v) => update({ refDistance: v })}
            />
            <NumericField
              label="Max Distance"
              value={panner.maxDistance ?? 10000}
              min={0}
              step={100}
              onChange={(v) => update({ maxDistance: v })}
            />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Rolloff Factor</Label>
                <span className="text-xs text-muted-foreground">
                  {(panner.rolloffFactor ?? 1).toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={10}
                step={0.1}
                value={[panner.rolloffFactor ?? 1]}
                onValueChange={(v) => update({ rolloffFactor: first(v) })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-medium">Cone</Label>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Inner Angle</Label>
                <span className="text-xs text-muted-foreground">
                  {panner.coneInnerAngle ?? 360}°
                </span>
              </div>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[panner.coneInnerAngle ?? 360]}
                onValueChange={(v) => update({ coneInnerAngle: first(v) })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Outer Angle</Label>
                <span className="text-xs text-muted-foreground">
                  {panner.coneOuterAngle ?? 360}°
                </span>
              </div>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[panner.coneOuterAngle ?? 360]}
                onValueChange={(v) => update({ coneOuterAngle: first(v) })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Outer Gain</Label>
                <span className="text-xs text-muted-foreground">
                  {(panner.coneOuterGain ?? 0).toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[panner.coneOuterGain ?? 0]}
                onValueChange={(v) => update({ coneOuterGain: first(v) })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
