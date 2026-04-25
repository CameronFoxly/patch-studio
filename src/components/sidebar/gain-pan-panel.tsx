"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type { Layer } from "@/lib/types";

function first(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function GainPanPanel({ layer }: { layer: Layer }) {
  const updateLayerGain = useStore((s) => s.updateLayerGain);
  const updateLayerPan = useStore((s) => s.updateLayerPan);
  const updateLayerDelay = useStore((s) => s.updateLayerDelay);

  const gain = layer.gain ?? 0.8;
  const pan = layer.pan ?? 0;
  const delay = layer.delay ?? 0;

  return (
    <div className="border-t px-4 py-3 space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Gain</Label>
          <span className="text-xs text-muted-foreground">
            {gain.toFixed(2)}
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[gain]}
          onValueChange={(v) => updateLayerGain(layer.id, first(v))}
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Pan</Label>
          <span className="text-xs text-muted-foreground">
            {pan < 0
              ? `L ${Math.abs(pan).toFixed(2)}`
              : pan > 0
                ? `R ${pan.toFixed(2)}`
                : "C"}
          </span>
        </div>
        <Slider
          min={-1}
          max={1}
          step={0.01}
          value={[pan]}
          onValueChange={(v) => updateLayerPan(layer.id, first(v))}
        />
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Onset Delay</Label>
          <span className="text-xs text-muted-foreground">
            {delay.toFixed(3)}s
          </span>
        </div>
        <Input
          type="number"
          min={0}
          max={30}
          step={0.01}
          value={delay}
          onChange={(e) =>
            updateLayerDelay(layer.id, Number(e.target.value) || 0)
          }
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}
