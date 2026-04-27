"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { Layer, LFO, OscillatorType } from "@/lib/types";
import { ENVELOPE_TAIL } from "@/lib/audio/constants";

interface Props {
  layer: Layer;
  blockWidth: number;
}

const LFO_COLOR = "#a855f7"; // purple-500
const FADE_DURATION = 300; // ms

function lfoSample(type: OscillatorType, phase: number): number {
  // phase is 0..1 within one cycle
  const p = phase - Math.floor(phase); // wrap to 0..1
  switch (type) {
    case "sine":
      return Math.sin(2 * Math.PI * p);
    case "triangle":
      return 4 * Math.abs(p - 0.5) - 1;
    case "square":
      return p < 0.5 ? 1 : -1;
    case "sawtooth":
      return 2 * (p - Math.floor(p + 0.5));
  }
}

function buildLfoPath(
  lfo: LFO,
  totalDuration: number,
  width: number,
  height: number,
): string {
  const samples = Math.max(width, 100);
  const amplitude = Math.min(1, lfo.depth / 200) * (height * 0.35);
  const centerY = height / 2;

  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * totalDuration;
    const phase = t * lfo.frequency;
    const y = centerY - lfoSample(lfo.type, phase) * amplitude;
    const x = (i / samples) * width;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(" ");
}

export function LfoOverlay({ layer, blockWidth }: Props) {
  const lfoInteractionLayerId = useStore((s) => s.lfoInteractionLayerId);
  const isInteracting = lfoInteractionLayerId === layer.id;

  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInteracting) {
      // Cancel any pending hide/fade
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setVisible(true);
      setOpacity(1);
    } else if (visible) {
      // Start 2-second hold then fade
      hideTimerRef.current = setTimeout(() => {
        setOpacity(0);
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, FADE_DURATION);
      }, 2000);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isInteracting]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  const lfos: LFO[] = !layer.lfo
    ? []
    : Array.isArray(layer.lfo)
      ? layer.lfo
      : [layer.lfo];

  if (lfos.length === 0) return null;

  const env = layer.envelope;
  const totalDuration = env
    ? (env.attack || 0) + env.decay + (env.release || 0) + ENVELOPE_TAIL
    : 2;

  const svgHeight = 100;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${blockWidth} ${svgHeight}`}
        preserveAspectRatio="none"
      >
        {lfos.map((lfo, i) => {
          const path = buildLfoPath(lfo, totalDuration, blockWidth, svgHeight);
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={LFO_COLOR}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              opacity={0.7}
            />
          );
        })}
        {/* Center line */}
        <line
          x1={0}
          y1={svgHeight / 2}
          x2={blockWidth}
          y2={svgHeight / 2}
          stroke={LFO_COLOR}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          opacity={0.2}
          strokeDasharray="4 3"
        />
      </svg>
    </div>
  );
}
