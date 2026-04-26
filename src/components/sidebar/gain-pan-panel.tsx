"use client";

import { useStore } from "@/lib/store";
import { SliderInput } from "@/components/ui/slider-input";
import { VolumeFader } from "@/components/ui/volume-fader";
import { RotaryKnob } from "@/components/ui/rotary-knob";
import { Separator } from "@/components/ui/separator";
import type { Layer } from "@/lib/types";

export function GainPanPanel({ layer }: { layer: Layer }) {
  const updateLayerGain = useStore((s) => s.updateLayerGain);
  const updateLayerPan = useStore((s) => s.updateLayerPan);
  const updateLayerDelay = useStore((s) => s.updateLayerDelay);

  const gain = layer.gain ?? 0.8;
  const pan = layer.pan ?? 0;
  const delay = layer.delay ?? 0;

  return (
    <div className="border-t px-4 py-3 space-y-3">
      <div className="flex items-start justify-center gap-4">
        <VolumeFader
          label="Gain"
          min={0}
          max={1}
          step={0.01}
          value={gain}
          onChange={(v) => updateLayerGain(layer.id, v)}
        />

        <div className="flex flex-col items-center justify-center pt-4">
          <RotaryKnob
            label="Pan"
            min={-1}
            max={1}
            step={0.01}
            value={pan}
            format={(v) =>
              v < 0 ? `L ${Math.abs(v).toFixed(2)}` : v > 0 ? `R ${v.toFixed(2)}` : "C"
            }
            onChange={(v) => updateLayerPan(layer.id, v)}
          />
        </div>
      </div>

      <Separator />

      <SliderInput
        label="Onset Delay"
        unit="s"
        min={0}
        max={30}
        step={0.01}
        value={delay}
        onChange={(v) => updateLayerDelay(layer.id, v)}
      />
    </div>
  );
}
