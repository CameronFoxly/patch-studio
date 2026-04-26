"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { SliderInput } from "@/components/ui/slider-input";
import { Switch } from "@/components/ui/switch";
import type { Layer, Envelope } from "@/lib/types";

const GRAPH_W = 280;
const GRAPH_H = 100;
const PAD = { top: 12, right: 12, bottom: 16, left: 12 };
const PLOT_W = GRAPH_W - PAD.left - PAD.right;
const PLOT_H = GRAPH_H - PAD.top - PAD.bottom;

const POINT_COLOR = "#3b82f6";
const SUSTAIN_HOLD = 0.3; // fixed sustain segment duration for display

type DragTarget = "attack" | "decay" | "release" | null;

function ADSRGraph({
  envelope,
  onChange,
}: {
  envelope: Envelope;
  onChange: (next: Envelope) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [hovered, setHovered] = useState<DragTarget>(null);

  const a = envelope.attack ?? 0;
  const d = envelope.decay;
  const s = envelope.sustain ?? 1;
  const r = envelope.release ?? 0;

  const total = a + d + SUSTAIN_HOLD + r;
  const scale = PLOT_W / total;

  // Key positions in SVG coords
  const x0 = PAD.left;
  const x1 = x0 + a * scale; // end of attack
  const x2 = x1 + d * scale; // end of decay
  const x3 = x2 + SUSTAIN_HOLD * scale; // end of sustain hold
  const x4 = x3 + r * scale; // end of release

  const yTop = PAD.top;
  const yBot = PAD.top + PLOT_H;
  const ySus = yBot - s * PLOT_H;

  const points = {
    start: { x: x0, y: yBot },
    attack: { x: x1, y: yTop },
    decay: { x: x2, y: ySus },
    sustainEnd: { x: x3, y: ySus },
    release: { x: x4, y: yBot },
  };

  const envelopePath = [
    `M ${points.start.x} ${points.start.y}`,
    `L ${points.attack.x} ${points.attack.y}`,
    `L ${points.decay.x} ${points.decay.y}`,
    `L ${points.sustainEnd.x} ${points.sustainEnd.y}`,
    `L ${points.release.x} ${points.release.y}`,
  ].join(" ");

  const fillPath = envelopePath + ` L ${x4} ${yBot} L ${x0} ${yBot} Z`;

  const getSvgPos = useCallback((e: React.PointerEvent | PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * GRAPH_W,
      y: ((e.clientY - rect.top) / rect.height) * GRAPH_H,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: DragTarget) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDragging(target);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const pos = getSvgPos(e);

      if (dragging === "attack") {
        // X controls attack time, clamped to [0, 5]
        const rawTime = Math.max(0, (pos.x - x0) / scale);
        const attackTime = Math.round(Math.min(5, rawTime) * 100) / 100;
        onChange({ ...envelope, attack: attackTime });
      } else if (dragging === "decay") {
        // X controls decay time, Y controls sustain level
        const rawDecay = Math.max(0, (pos.x - x1) / scale);
        const decayTime = Math.round(Math.min(5, rawDecay) * 100) / 100;
        const rawSustain = 1 - (pos.y - yTop) / PLOT_H;
        const sustainLevel = Math.round(Math.max(0, Math.min(1, rawSustain)) * 100) / 100;
        onChange({ ...envelope, decay: decayTime, sustain: sustainLevel });
      } else if (dragging === "release") {
        // X controls release time
        const rawRelease = Math.max(0, (pos.x - x3) / scale);
        const releaseTime = Math.round(Math.min(5, rawRelease) * 100) / 100;
        onChange({ ...envelope, release: releaseTime });
      }
    },
    [dragging, envelope, onChange, getSvgPos, scale, x0, x1, x3, yTop]
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const controlPoints: { id: DragTarget; x: number; y: number; label: string }[] = [
    { id: "attack", x: points.attack.x, y: points.attack.y, label: "A" },
    { id: "decay", x: points.decay.x, y: points.decay.y, label: "D/S" },
    { id: "release", x: points.release.x, y: points.release.y, label: "R" },
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      className="w-full rounded-md border bg-muted/20 select-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Zero line */}
      <line
        x1={PAD.left} y1={yBot} x2={PAD.left + PLOT_W} y2={yBot}
        className="stroke-muted-foreground/20" strokeWidth={0.5}
      />
      {/* Peak line */}
      <line
        x1={PAD.left} y1={yTop} x2={PAD.left + PLOT_W} y2={yTop}
        className="stroke-muted-foreground/10" strokeWidth={0.5}
        strokeDasharray="4 2"
      />
      {/* Sustain level line */}
      <line
        x1={x1} y1={ySus} x2={x4} y2={ySus}
        className="stroke-muted-foreground/15" strokeWidth={0.5}
        strokeDasharray="2 2"
      />

      {/* Fill */}
      <path d={fillPath} fill={POINT_COLOR} opacity={0.08} />

      {/* Envelope line */}
      <path
        d={envelopePath}
        fill="none"
        stroke={POINT_COLOR}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Section labels */}
      <text x={(x0 + x1) / 2} y={yBot + 11} fill="currentColor" fontSize={8} textAnchor="middle" className="fill-muted-foreground">A</text>
      <text x={(x1 + x2) / 2} y={yBot + 11} fill="currentColor" fontSize={8} textAnchor="middle" className="fill-muted-foreground">D</text>
      <text x={(x2 + x3) / 2} y={yBot + 11} fill="currentColor" fontSize={8} textAnchor="middle" className="fill-muted-foreground">S</text>
      <text x={(x3 + x4) / 2} y={yBot + 11} fill="currentColor" fontSize={8} textAnchor="middle" className="fill-muted-foreground">R</text>

      {/* Control points */}
      {controlPoints.map((cp) => {
        const isActive = dragging === cp.id || hovered === cp.id;
        return (
          <g key={cp.id}>
            {/* Highlight ring */}
            {isActive && (
              <circle cx={cp.x} cy={cp.y} r={10} fill={POINT_COLOR} opacity={0.15} className="pointer-events-none" />
            )}
            {/* Visible dot */}
            <circle
              cx={cp.x} cy={cp.y} r={5}
              fill={POINT_COLOR}
              stroke={isActive ? "white" : "none"}
              strokeWidth={2}
              className="pointer-events-none"
            />
            {/* Hit area — rendered last so it's on top */}
            <circle
              cx={cp.x} cy={cp.y} r={18}
              fill="transparent"
              className="cursor-grab"
              style={{ cursor: dragging === cp.id ? "grabbing" : "grab" }}
              onPointerDown={(e) => handlePointerDown(e, cp.id)}
              onPointerEnter={() => setHovered(cp.id)}
              onPointerLeave={() => setHovered(null)}
            />
          </g>
        );
      })}
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
          <ADSRGraph envelope={env} onChange={setEnvelope} />

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
