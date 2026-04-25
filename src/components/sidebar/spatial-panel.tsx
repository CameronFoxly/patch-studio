"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SliderInput } from "@/components/ui/slider-input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, Panner3D, PanningModel, DistanceModel } from "@/lib/types";

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
            <div className="space-y-2">
              <SliderInput
                label="X"
                min={-100}
                max={100}
                step={0.1}
                value={panner.positionX ?? 0}
                onChange={(v) => update({ positionX: v })}
              />
              <SliderInput
                label="Y"
                min={-100}
                max={100}
                step={0.1}
                value={panner.positionY ?? 0}
                onChange={(v) => update({ positionY: v })}
              />
              <SliderInput
                label="Z"
                min={-100}
                max={100}
                step={0.1}
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
            <SliderInput
              label="Ref Distance"
              min={0}
              max={100}
              step={0.1}
              value={panner.refDistance ?? 1}
              onChange={(v) => update({ refDistance: v })}
            />
            <SliderInput
              label="Max Distance"
              min={0}
              max={50000}
              step={100}
              value={panner.maxDistance ?? 10000}
              onChange={(v) => update({ maxDistance: v })}
            />
            <SliderInput
              label="Rolloff Factor"
              min={0}
              max={10}
              step={0.1}
              value={panner.rolloffFactor ?? 1}
              onChange={(v) => update({ rolloffFactor: v })}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-medium">Cone</Label>
            <SliderInput
              label="Inner Angle"
              unit="°"
              min={0}
              max={360}
              step={1}
              value={panner.coneInnerAngle ?? 360}
              onChange={(v) => update({ coneInnerAngle: v })}
            />
            <SliderInput
              label="Outer Angle"
              unit="°"
              min={0}
              max={360}
              step={1}
              value={panner.coneOuterAngle ?? 360}
              onChange={(v) => update({ coneOuterAngle: v })}
            />
            <SliderInput
              label="Outer Gain"
              min={0}
              max={1}
              step={0.01}
              value={panner.coneOuterGain ?? 0}
              onChange={(v) => update({ coneOuterGain: v })}
            />
          </div>
        </>
      )}
    </div>
  );
}
