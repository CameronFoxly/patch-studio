"use client";

import { useStore } from "@/lib/store";
import { VolumeFader } from "@/components/ui/volume-fader";
import { RotaryKnob } from "@/components/ui/rotary-knob";
import { useMasterAmplitude } from "@/hooks/use-master-amplitude";
import type { Layer } from "@/lib/types";

export function GainPanPanel({ layer }: { layer: Layer }) {
  const updateLayerGain = useStore((s) => s.updateLayerGain);
  const updateLayerPan = useStore((s) => s.updateLayerPan);
  const amplitude = useMasterAmplitude();

  const gain = layer.gain ?? 0.8;
  const pan = layer.pan ?? 0;

  return (
    <div className="border-t bg-card px-4 py-3 space-y-3">
      <div className="flex items-start justify-center gap-4">
        <VolumeFader
          label="Gain"
          min={0}
          max={1}
          step={0.01}
          value={gain}
          onChange={(v) => updateLayerGain(layer.id, v)}
          amplitude={amplitude}
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


    </div>
  );
}
