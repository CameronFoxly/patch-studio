"use client";

import { useCallback, useRef, useState } from "react";
import type { Layer, Envelope } from "@/lib/types";

interface Props {
  layer: Layer;
  blockWidth: number;
  onUpdateEnvelope: (envelope: Envelope) => void;
}

type DragPoint = "attack" | "decay" | "release" | null;

const POINT_COLOR = "#3b82f6";

export function EnvelopeOverlay({ layer, blockWidth, onUpdateEnvelope }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragPoint>(null);
  const [hovered, setHovered] = useState<DragPoint>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; env: Envelope } | null>(null);

  const env = layer.envelope;
  if (!env) return null;

  const attack = env.attack || 0;
  const decay = env.decay;
  const sustain = env.sustain ?? 0;
  const release = env.release || 0;
  const totalDuration = attack + decay + release + 0.5;

  const timeToX = (t: number) => (t / totalDuration) * blockWidth;
  const heightPct = (amp: number) => (1 - amp) * 100;

  const x0 = 0;
  const y0 = 100;
  const xA = timeToX(attack);
  const yA = 0;
  const xD = timeToX(attack + decay);
  const yD = heightPct(sustain);
  const xS = timeToX(totalDuration - release);
  const yS = yD;
  const xR = timeToX(totalDuration);
  const yR = 100;

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
            const dy = moveE.clientY - dragStartRef.current.mouseY;
            next.decay = Math.max(0.01, Math.min(5, startEnv.decay + timeDelta));
            const sustainDelta = dy / 60;
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

  const controlPoints: { id: DragPoint; cx: number; cy: number; label: string }[] = [
    { id: "attack", cx: xA, cy: yA, label: "A" },
    { id: "decay", cx: xD, cy: yD, label: "D/S" },
    { id: "release", cx: xR, cy: yR, label: "R" },
  ];

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Envelope path — stretched SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${blockWidth} 100`}
        preserveAspectRatio="none"
      >
        <path
          d={`M ${x0} ${y0} L ${xA} ${yA} L ${xD} ${yD} L ${xS} ${yS} L ${xR} ${yR} Z`}
          fill={POINT_COLOR}
          opacity={0.1}
        />
        <path
          d={`M ${x0} ${y0} L ${xA} ${yA} L ${xD} ${yD} L ${xS} ${yS} L ${xR} ${yR}`}
          fill="none"
          stroke={POINT_COLOR}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          opacity={0.6}
          strokeLinejoin="round"
        />
        <line
          x1={xD} y1={yD} x2={xR} y2={yD}
          stroke={POINT_COLOR}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity={0.2}
          strokeDasharray="3 2"
        />
      </svg>

      {/* Control points — positioned as HTML elements to stay circular */}
      {controlPoints.map((cp) => {
        const isActive = dragging === cp.id || hovered === cp.id;
        const leftPct = (cp.cx / blockWidth) * 100;
        const topPct = cp.cy;
        return (
          <div
            key={cp.id}
            className="absolute pointer-events-auto"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Hit area */}
            <div
              className={`absolute inset-0 flex items-center justify-center ${dragging === cp.id ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ width: 32, height: 32, margin: "-16px 0 0 -16px", left: "50%", top: "50%" }}
              onMouseDown={(e) => handlePointMouseDown(cp.id, e)}
              onMouseEnter={() => setHovered(cp.id)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Highlight ring */}
            {isActive && (
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 20,
                  height: 20,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: POINT_COLOR,
                  opacity: 0.15,
                }}
              />
            )}
            {/* Visible dot */}
            <div
              className="pointer-events-none rounded-full"
              style={{
                width: isActive ? 12 : 10,
                height: isActive ? 12 : 10,
                backgroundColor: POINT_COLOR,
                border: isActive ? "2px solid white" : "none",
                margin: "auto",
              }}
            />
            {/* Label */}
            <span
              className="absolute pointer-events-none select-none font-medium text-center"
              style={{
                fontSize: 8,
                color: POINT_COLOR,
                opacity: isActive ? 1 : 0.6,
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: 2,
                whiteSpace: "nowrap",
              }}
            >
              {cp.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
