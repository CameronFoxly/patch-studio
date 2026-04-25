"use client";

import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { SliderInput } from "@/components/ui/slider-input";
import { Switch } from "@/components/ui/switch";
import type { Layer, Envelope } from "@/lib/types";

function ADSRPreview({ envelope }: { envelope: Envelope }) {
  const a = envelope.attack ?? 0;
  const d = envelope.decay;
  const s = envelope.sustain ?? 1;
  const r = envelope.release ?? 0;

  const total = a + d + 0.3 + r;
  const w = 240;
  const h = 64;
  const pad = 4;

  const scale = (w - pad * 2) / total;
  const x0 = pad;
  const x1 = x0 + a * scale;
  const x2 = x1 + d * scale;
  const x3 = x2 + 0.3 * scale;
  const x4 = x3 + r * scale;

  const yTop = pad;
  const yBot = h - pad;
  const ySus = yBot - s * (yBot - yTop);

  const path = [
    `M ${x0} ${yBot}`,
    `L ${x1} ${yTop}`,
    `L ${x2} ${ySus}`,
    `L ${x3} ${ySus}`,
    `L ${x4} ${yBot}`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-16 rounded border bg-muted/30"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-primary"
      />
      <text
        x={x0 + 2}
        y={yBot - 2}
        className="fill-muted-foreground text-[8px]"
      >
        A
      </text>
      <text
        x={x1 + 2}
        y={yBot - 2}
        className="fill-muted-foreground text-[8px]"
      >
        D
      </text>
      <text
        x={x2 + 2}
        y={yBot - 2}
        className="fill-muted-foreground text-[8px]"
      >
        S
      </text>
      <text
        x={x3 + 2}
        y={yBot - 2}
        className="fill-muted-foreground text-[8px]"
      >
        R
      </text>
    </svg>
  );
}

export function EnvelopePanel({ layer }: { layer: Layer }) {
  const updateLayerEnvelope = useStore((s) => s.updateLayerEnvelope);
  const envelope = layer.envelope;
  const enabled = !!envelope;

  function setEnvelope(next: Envelope) {
    updateLayerEnvelope(layer.id, next);
  }

  const env: Envelope = envelope ?? {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.7,
    release: 0.1,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Envelope</Label>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            updateLayerEnvelope(layer.id, checked ? env : undefined)
          }
          size="sm"
        />
      </div>

      {enabled && (
        <>
          <ADSRPreview envelope={env} />

          <div className="space-y-3">
            <SliderInput label="Attack" unit="s" min={0} max={5} step={0.01} value={env.attack ?? 0} onChange={(v) => setEnvelope({ ...env, attack: v })} />
            <SliderInput label="Decay" unit="s" min={0} max={5} step={0.01} value={env.decay} onChange={(v) => setEnvelope({ ...env, decay: v })} />
            <SliderInput label="Sustain" min={0} max={1} step={0.01} value={env.sustain ?? 1} onChange={(v) => setEnvelope({ ...env, sustain: v })} />
            <SliderInput label="Release" unit="s" min={0} max={5} step={0.01} value={env.release ?? 0} onChange={(v) => setEnvelope({ ...env, release: v })} />
          </div>
        </>
      )}
    </div>
  );
}
