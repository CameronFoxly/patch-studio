"use client";

import { useCallback, useRef, useState } from "react";
import type { Layer, Envelope } from "@/lib/types";

interface Props {
  layer: Layer;
  blockWidth: number;
  onUpdateEnvelope: (envelope: Envelope) => void;
}

type DragPoint = "attack" | "decay" | "release" | null;

export function EnvelopeOverlay({ layer, blockWidth, onUpdateEnvelope }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DragPoint>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; env: Envelope } | null>(null);

  const env = layer.envelope;
  if (!env) return null;

  const attack = env.attack || 0;
  const decay = env.decay;
  const sustain = env.sustain ?? 0;
  const release = env.release || 0;
  const totalDuration = attack + decay + release + 0.5; // matches soundDuration calc

  // Convert time to x position
  const timeToX = (t: number) => (t / totalDuration) * blockWidth;
  const heightPct = (amp: number) => (1 - amp) * 100; // 0=top, 100=bottom (percentage)

  // ADSR path points
  const x0 = 0;
  const y0 = 100; // start at zero amplitude
  const xA = timeToX(attack);
  const yA = 0; // peak at full amplitude
  const xD = timeToX(attack + decay);
  const yD = heightPct(sustain);
  const xS = timeToX(totalDuration - release - 0.25); // sustain hold point
  const yS = yD;
  const xR = timeToX(totalDuration - 0.25);
  const yR = 100; // release to zero

  // Draggable control point handler
  const handlePointMouseDown = useCallback(
    (point: DragPoint, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(point);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        env: { ...env },
      };

      const handleMove = (moveE: MouseEvent) => {
        if (!dragStartRef.current || !point) return;
        const dx = moveE.clientX - dragStartRef.current.mouseX;
        const startEnv = dragStartRef.current.env;
        const timeDelta = (dx / blockWidth) * totalDuration;

        const next = { ...startEnv };

        switch (point) {
          case "attack": {
            next.attack = Math.max(0, Math.min(2, (startEnv.attack || 0) + timeDelta));
            break;
          }
          case "decay": {
            // Horizontal drag changes decay, vertical drag changes sustain
            const dy = moveE.clientY - dragStartRef.current.mouseY;
            next.decay = Math.max(0.01, Math.min(5, startEnv.decay + timeDelta));
            const sustainDelta = dy / 60; // 60px = full range
            next.sustain = Math.max(0, Math.min(1, (startEnv.sustain ?? 0) - sustainDelta));
            break;
          }
          case "release": {
            next.release = Math.max(0, Math.min(5, (startEnv.release || 0) + timeDelta));
            break;
          }
        }

        onUpdateEnvelope(next);
      };

      const handleUp = () => {
        setDragging(null);
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [env, blockWidth, totalDuration, onUpdateEnvelope],
  );

  const [hovered, setHovered] = useState<DragPoint>(null);

  const controlPoint = (
    point: DragPoint,
    cx: number,
    cy: number,
    label: string,
  ) => {
    const isActive = dragging === point;
    const isHovered = hovered === point;

    return (
      <g key={point}>
        {/* Hover highlight ring */}
        <circle
          cx={cx}
          cy={cy}
          r="8"
          vectorEffect="non-scaling-stroke"
          fill="currentColor"
          className={`text-primary transition-opacity duration-150 pointer-events-none ${
            isActive ? "opacity-20" : isHovered ? "opacity-15" : "opacity-0"
          }`}
        />
        {/* Visible dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? "5" : isHovered ? "5" : "4"}
          vectorEffect="non-scaling-stroke"
          fill="currentColor"
          className={`text-primary pointer-events-none transition-all duration-150 ${
            isActive ? "opacity-100" : isHovered ? "opacity-90" : "opacity-70"
          }`}
        />
        {/* Invisible hit area — larger, captures pointer events */}
        <circle
          cx={cx}
          cy={cy}
          r="12"
          vectorEffect="non-scaling-stroke"
          fill="transparent"
          className={`pointer-events-auto ${isActive ? "cursor-grabbing" : "cursor-pointer"}`}
          onMouseDown={(e) => handlePointMouseDown(point, e)}
          onMouseEnter={() => setHovered(point)}
          onMouseLeave={() => setHovered(null)}
        />
        {/* Label */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize="8"
          vectorEffect="non-scaling-stroke"
          className={`pointer-events-none select-none transition-opacity duration-150 ${
            isActive || isHovered ? "fill-primary" : "fill-primary/60"
          }`}
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${blockWidth} 100`}
      preserveAspectRatio="none"
    >
      {/* ADSR shape fill */}
      <path
        d={`M ${x0} ${y0} L ${xA} ${yA} L ${xD} ${yD} L ${xS} ${yS} L ${xR} ${yR} Z`}
        fill="currentColor"
        className="text-primary/15"
      />
      {/* ADSR shape line */}
      <path
        d={`M ${x0} ${y0} L ${xA} ${yA} L ${xD} ${yD} L ${xS} ${yS} L ${xR} ${yR}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className="text-primary/60"
      />
      {controlPoint("attack", xA, yA, "A")}
      {controlPoint("decay", xD, yD, "D/S")}
      {controlPoint("release", xR, yR, "R")}
    </svg>
  );
}
