"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { BiquadFilter, BiquadFilterType, IIRFilter, Source } from "@/lib/types";

const SAMPLE_RATE = 48000;
const GRAPH_W = 600;
const GRAPH_H = 160;
const PAD = { top: 8, right: 8, bottom: 20, left: 32 };
const PLOT_W = GRAPH_W - PAD.left - PAD.right;
const PLOT_H = GRAPH_H - PAD.top - PAD.bottom;

const FREQ_MIN = 20;
const FREQ_MAX = 20000;
const DB_MIN = -24;
const DB_MAX = 24;
const DB_RANGE = DB_MAX - DB_MIN;

const NUM_POINTS = 256;

const FILTER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#a855f7", "#06b6d4", "#ec4899", "#84cc16",
];

const FREQ_GRID = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const DB_GRID = [-12, 0, 12];

const GAIN_TYPES: BiquadFilterType[] = ["peaking", "lowshelf", "highshelf"];

// Log scale conversions
function freqToX(f: number): number {
  const logMin = Math.log10(FREQ_MIN);
  const logMax = Math.log10(FREQ_MAX);
  return PAD.left + ((Math.log10(f) - logMin) / (logMax - logMin)) * PLOT_W;
}

function xToFreq(x: number): number {
  const logMin = Math.log10(FREQ_MIN);
  const logMax = Math.log10(FREQ_MAX);
  const ratio = Math.max(0, Math.min(1, (x - PAD.left) / PLOT_W));
  return Math.pow(10, logMin + ratio * (logMax - logMin));
}

function dbToY(db: number): number {
  return PAD.top + ((DB_MAX - db) / DB_RANGE) * PLOT_H;
}

function yToDb(y: number): number {
  return DB_MAX - ((y - PAD.top) / PLOT_H) * DB_RANGE;
}

function yToQ(y: number): number {
  // Map Y: top=30, bottom=0.1
  const ratio = Math.max(0, Math.min(1, (y - PAD.top) / PLOT_H));
  return 30 * Math.pow(0.1 / 30, ratio);
}

function qToY(q: number): number {
  // Inverse of yToQ
  const ratio = Math.log(q / 30) / Math.log(0.1 / 30);
  return PAD.top + ratio * PLOT_H;
}

// Biquad coefficient computation (Audio EQ Cookbook)
function biquadCoeffs(type: BiquadFilterType, f0: number, Q: number, gain: number) {
  const w0 = (2 * Math.PI * f0) / SAMPLE_RATE;
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = sinw / (2 * Q);
  const A = Math.pow(10, gain / 40);

  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;

  switch (type) {
    case "lowpass":
      b0 = (1 - cosw) / 2;
      b1 = 1 - cosw;
      b2 = (1 - cosw) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw;
      a2 = 1 - alpha;
      break;
    case "highpass":
      b0 = (1 + cosw) / 2;
      b1 = -(1 + cosw);
      b2 = (1 + cosw) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw;
      a2 = 1 - alpha;
      break;
    case "bandpass":
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosw;
      a2 = 1 - alpha;
      break;
    case "notch":
      b0 = 1;
      b1 = -2 * cosw;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cosw;
      a2 = 1 - alpha;
      break;
    case "allpass":
      b0 = 1 - alpha;
      b1 = -2 * cosw;
      b2 = 1 + alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosw;
      a2 = 1 - alpha;
      break;
    case "peaking":
      b0 = 1 + alpha * A;
      b1 = -2 * cosw;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw;
      a2 = 1 - alpha / A;
      break;
    case "lowshelf": {
      const sq = 2 * Math.sqrt(A) * alpha;
      b0 = A * (A + 1 - (A - 1) * cosw + sq);
      b1 = 2 * A * (A - 1 - (A + 1) * cosw);
      b2 = A * (A + 1 - (A - 1) * cosw - sq);
      a0 = A + 1 + (A - 1) * cosw + sq;
      a1 = -2 * (A - 1 + (A + 1) * cosw);
      a2 = A + 1 + (A - 1) * cosw - sq;
      break;
    }
    case "highshelf": {
      const sq = 2 * Math.sqrt(A) * alpha;
      b0 = A * (A + 1 + (A - 1) * cosw + sq);
      b1 = -2 * A * (A - 1 + (A + 1) * cosw);
      b2 = A * (A + 1 + (A - 1) * cosw - sq);
      a0 = A + 1 - (A - 1) * cosw + sq;
      a1 = 2 * (A - 1 - (A + 1) * cosw);
      a2 = A + 1 - (A - 1) * cosw - sq;
      break;
    }
    default:
      b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;
  }

  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

// Magnitude response in dB at frequency f
function magnitudeAt(coeffs: ReturnType<typeof biquadCoeffs>, f: number): number {
  const w = (2 * Math.PI * f) / SAMPLE_RATE;
  const cosw = Math.cos(w);
  const cos2w = Math.cos(2 * w);
  const sinw = Math.sin(w);
  const sin2w = Math.sin(2 * w);

  const numReal = coeffs.b0 + coeffs.b1 * cosw + coeffs.b2 * cos2w;
  const numImag = coeffs.b1 * sinw + coeffs.b2 * sin2w;
  const denReal = 1 + coeffs.a1 * cosw + coeffs.a2 * cos2w;
  const denImag = coeffs.a1 * sinw + coeffs.a2 * sin2w;

  const numMag = Math.sqrt(numReal * numReal + numImag * numImag);
  const denMag = Math.sqrt(denReal * denReal + denImag * denImag);

  if (denMag === 0) return 0;
  return 20 * Math.log10(numMag / denMag);
}

// Generate log-spaced frequency array
function logFreqs(): number[] {
  const freqs: number[] = [];
  const logMin = Math.log10(FREQ_MIN);
  const logMax = Math.log10(FREQ_MAX);
  for (let i = 0; i < NUM_POINTS; i++) {
    freqs.push(Math.pow(10, logMin + (i / (NUM_POINTS - 1)) * (logMax - logMin)));
  }
  return freqs;
}

const FREQS = logFreqs();

// Compute response curve as SVG path
function responsePath(filter: BiquadFilter): string {
  const coeffs = biquadCoeffs(filter.type, filter.frequency, filter.resonance ?? 1, filter.gain ?? 0);
  const points = FREQS.map((f) => {
    const db = magnitudeAt(coeffs, f);
    return `${freqToX(f)},${dbToY(Math.max(DB_MIN, Math.min(DB_MAX, db)))}`;
  });
  return `M ${points.join(" L ")}`;
}

// Compute combined response
function combinedPath(filters: BiquadFilter[]): string {
  if (filters.length === 0) return "";
  const allCoeffs = filters.map((f) =>
    biquadCoeffs(f.type, f.frequency, f.resonance ?? 1, f.gain ?? 0)
  );
  const points = FREQS.map((f) => {
    let totalDb = 0;
    for (const c of allCoeffs) {
      totalDb += magnitudeAt(c, f);
    }
    return `${freqToX(f)},${dbToY(Math.max(DB_MIN, Math.min(DB_MAX, totalDb)))}`;
  });
  return `M ${points.join(" L ")}`;
}

// Filled area path (for combined response)
function combinedFillPath(filters: BiquadFilter[]): string {
  if (filters.length === 0) return "";
  const allCoeffs = filters.map((f) =>
    biquadCoeffs(f.type, f.frequency, f.resonance ?? 1, f.gain ?? 0)
  );
  const points = FREQS.map((f) => {
    let totalDb = 0;
    for (const c of allCoeffs) totalDb += magnitudeAt(c, f);
    return `${freqToX(f)},${dbToY(Math.max(DB_MIN, Math.min(DB_MAX, totalDb)))}`;
  });
  const zeroY = dbToY(0);
  return `M ${PAD.left},${zeroY} L ${points.join(" L ")} L ${PAD.left + PLOT_W},${zeroY} Z`;
}

// Control point Y position based on filter type
function controlY(filter: BiquadFilter): number {
  if (GAIN_TYPES.includes(filter.type)) {
    return dbToY(filter.gain ?? 0);
  }
  return qToY(filter.resonance ?? 1);
}

// Compute a spectral profile for the source (amplitude in dB at each frequency)
function sourceSpectrumPath(source: Source | undefined): string {
  if (!source) return "";

  const points: string[] = [];

  for (const f of FREQS) {
    let dbVal: number;

    if (source.type === "noise") {
      const color = source.color || "white";
      if (color === "white") {
        dbVal = -6; // flat
      } else if (color === "pink") {
        dbVal = -6 - 3 * Math.log2(f / 1000); // -3dB/octave
      } else {
        // brown
        dbVal = -6 - 6 * Math.log2(f / 1000); // -6dB/octave
      }
    } else {
      const freq = "frequency" in source
        ? (typeof source.frequency === "number" ? source.frequency : source.frequency.start)
        : 440;

      // Compute harmonic spectrum
      dbVal = DB_MIN - 6;
      const maxHarmonic = Math.floor(20000 / freq);

      if (source.type === "sine") {
        // Pure tone — single spike at fundamental
        const dist = Math.abs(Math.log2(f / freq));
        dbVal = dist < 0.05 ? 0 : -60;
      } else if (source.type === "wavetable" && source.harmonics) {
        let amp = 0;
        for (let h = 0; h < source.harmonics.length && h < maxHarmonic; h++) {
          const hFreq = freq * (h + 1);
          const dist = Math.abs(Math.log2(f / hFreq));
          if (dist < 0.05) amp += Math.abs(source.harmonics[h]);
        }
        dbVal = amp > 0 ? 20 * Math.log10(amp) : -60;
      } else {
        // Analytic spectra for standard waveforms
        let totalAmp = 0;
        for (let n = 1; n <= maxHarmonic; n++) {
          const hFreq = freq * n;
          const dist = Math.abs(Math.log2(f / hFreq));
          if (dist > 0.08) continue;

          let hAmp = 0;
          if (source.type === "sawtooth") {
            hAmp = 1 / n;
          } else if (source.type === "square") {
            hAmp = n % 2 === 1 ? 1 / n : 0;
          } else if (source.type === "triangle") {
            hAmp = n % 2 === 1 ? 1 / (n * n) : 0;
          }
          totalAmp += hAmp;
        }
        dbVal = totalAmp > 0 ? 20 * Math.log10(totalAmp) : -60;
      }
    }

    const clampedDb = Math.max(DB_MIN, Math.min(DB_MAX, dbVal));
    points.push(`${freqToX(f)},${dbToY(clampedDb)}`);
  }

  return `M ${points.join(" L ")}`;
}

function sourceSpectrumFillPath(source: Source | undefined): string {
  const line = sourceSpectrumPath(source);
  if (!line) return "";
  const zeroY = dbToY(DB_MIN);
  return `${line} L ${PAD.left + PLOT_W},${zeroY} L ${PAD.left},${zeroY} Z`;
}

interface FilterGraphProps {
  filters: BiquadFilter[];
  selectedIndex: number | null;
  source?: Source;
  onSelectFilter: (index: number) => void;
  onUpdateFilter: (index: number, updated: BiquadFilter) => void;
}

export function FilterGraph({ filters, selectedIndex, source, onSelectFilter, onUpdateFilter }: FilterGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = GRAPH_W / rect.width;
    const scaleY = GRAPH_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(index);
    onSelectFilter(index);
  }, [onSelectFilter]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging === null) return;
    const pos = getMousePos(e);
    const filter = filters[dragging];
    if (!filter) return;

    const freq = Math.round(Math.max(FREQ_MIN, Math.min(FREQ_MAX, xToFreq(pos.x))));

    if (GAIN_TYPES.includes(filter.type)) {
      const gain = Math.round(Math.max(DB_MIN, Math.min(DB_MAX, yToDb(pos.y))) * 2) / 2;
      onUpdateFilter(dragging, { ...filter, frequency: freq, gain });
    } else {
      const q = Math.round(Math.max(0.1, Math.min(30, yToQ(pos.y))) * 10) / 10;
      onUpdateFilter(dragging, { ...filter, frequency: freq, resonance: q });
    }
  }, [dragging, filters, getMousePos, onUpdateFilter]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const formatFreq = (f: number) => f >= 1000 ? `${f / 1000}k` : `${f}`;

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
      {/* Grid lines */}
      {FREQ_GRID.map((f) => (
        <g key={`fg-${f}`}>
          <line
            x1={freqToX(f)} y1={PAD.top} x2={freqToX(f)} y2={PAD.top + PLOT_H}
            className="stroke-muted-foreground/10" strokeWidth={0.5}
          />
          <text
            x={freqToX(f)} y={GRAPH_H - 4}
            className="fill-muted-foreground" fontSize={8} textAnchor="middle"
          >
            {formatFreq(f)}
          </text>
        </g>
      ))}
      {DB_GRID.map((db) => (
        <g key={`db-${db}`}>
          <line
            x1={PAD.left} y1={dbToY(db)} x2={PAD.left + PLOT_W} y2={dbToY(db)}
            className={db === 0 ? "stroke-muted-foreground/30" : "stroke-muted-foreground/10"}
            strokeWidth={db === 0 ? 1 : 0.5}
          />
          <text
            x={PAD.left - 4} y={dbToY(db) + 3}
            className="fill-muted-foreground" fontSize={8} textAnchor="end"
          >
            {db > 0 ? `+${db}` : db}
          </text>
        </g>
      ))}

      {/* Plot area clip */}
      <defs>
        <clipPath id="plot-clip">
          <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>

      <g clipPath="url(#plot-clip)">
        {/* Source frequency spectrum */}
        {source && (
          <>
            <path
              d={sourceSpectrumFillPath(source)}
              className="fill-muted-foreground/5"
            />
            <path
              d={sourceSpectrumPath(source)}
              fill="none"
              className="stroke-muted-foreground/20"
              strokeWidth={1}
            />
          </>
        )}

        {/* Combined fill */}
        {filters.length > 0 && (
          <path
            d={combinedFillPath(filters)}
            className="fill-primary/10"
          />
        )}

        {/* Individual filter curves */}
        {filters.map((filter, i) => (
          <path
            key={i}
            d={responsePath(filter)}
            fill="none"
            stroke={FILTER_COLORS[i % FILTER_COLORS.length]}
            strokeWidth={selectedIndex === i ? 2 : 1}
            opacity={selectedIndex === null || selectedIndex === i ? 0.7 : 0.25}
          />
        ))}

        {/* Combined response */}
        {filters.length > 1 && (
          <path
            d={combinedPath(filters)}
            fill="none"
            className="stroke-foreground"
            strokeWidth={2}
            opacity={0.9}
          />
        )}
      </g>

      {/* Control points */}
      {filters.map((filter, i) => {
        const cx = freqToX(filter.frequency);
        const cy = controlY(filter);
        const isActive = selectedIndex === i || hovered === i || dragging === i;
        const color = FILTER_COLORS[i % FILTER_COLORS.length];
        return (
          <g key={`ctrl-${i}`}>
            {/* Highlight ring */}
            {isActive && (
              <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.15} className="pointer-events-none" />
            )}
            {/* Visible dot */}
            <circle
              cx={cx} cy={cy} r={7}
              fill={color}
              stroke={isActive ? "white" : "none"}
              strokeWidth={2}
              className="pointer-events-none"
            />
            {/* Label */}
            <text
              x={cx} y={cy - 12}
              fill={color} fontSize={9} textAnchor="middle"
              className="pointer-events-none font-medium"
            >
              {i + 1}
            </text>
            {/* Hit area — rendered last so it's on top for pointer events */}
            <circle
              cx={cx} cy={cy} r={24}
              fill="transparent"
              className="cursor-grab"
              style={{ cursor: dragging === i ? "grabbing" : "grab" }}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ── IIR Filter Frequency Response Graph ── */

// Evaluate H(e^{jω}) = B(e^{jω}) / A(e^{jω}) magnitude in dB
function iirMagnitudeAt(feedforward: number[], feedback: number[], f: number): number {
  const w = (2 * Math.PI * f) / SAMPLE_RATE;

  let numReal = 0, numImag = 0;
  for (let k = 0; k < feedforward.length; k++) {
    numReal += feedforward[k] * Math.cos(k * w);
    numImag -= feedforward[k] * Math.sin(k * w);
  }

  let denReal = 0, denImag = 0;
  for (let k = 0; k < feedback.length; k++) {
    denReal += feedback[k] * Math.cos(k * w);
    denImag -= feedback[k] * Math.sin(k * w);
  }

  const numMag = Math.sqrt(numReal * numReal + numImag * numImag);
  const denMag = Math.sqrt(denReal * denReal + denImag * denImag);

  if (denMag === 0) return 0;
  return 20 * Math.log10(numMag / denMag);
}

function iirResponsePath(filter: IIRFilter): string {
  const points = FREQS.map((f) => {
    const db = iirMagnitudeAt(filter.feedforward, filter.feedback, f);
    return `${freqToX(f)},${dbToY(Math.max(DB_MIN, Math.min(DB_MAX, db)))}`;
  });
  return `M ${points.join(" L ")}`;
}

function iirFillPath(filter: IIRFilter): string {
  const line = iirResponsePath(filter);
  if (!line) return "";
  const zeroY = dbToY(0);
  return `M ${PAD.left},${zeroY} L ${line.slice(2)} L ${PAD.left + PLOT_W},${zeroY} Z`;
}

interface IIRFilterGraphProps {
  filter: IIRFilter;
}

export function IIRFilterGraph({ filter }: IIRFilterGraphProps) {
  const formatFreq = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

  return (
    <svg
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      className="w-full rounded-md border bg-muted/20 select-none"
    >
      {/* Grid lines */}
      {FREQ_GRID.map((f) => (
        <g key={`fg-${f}`}>
          <line
            x1={freqToX(f)} y1={PAD.top} x2={freqToX(f)} y2={PAD.top + PLOT_H}
            className="stroke-muted-foreground/10" strokeWidth={0.5}
          />
          <text
            x={freqToX(f)} y={GRAPH_H - 4}
            className="fill-muted-foreground" fontSize={8} textAnchor="middle"
          >
            {formatFreq(f)}
          </text>
        </g>
      ))}
      {DB_GRID.map((db) => (
        <g key={`db-${db}`}>
          <line
            x1={PAD.left} y1={dbToY(db)} x2={PAD.left + PLOT_W} y2={dbToY(db)}
            className={db === 0 ? "stroke-muted-foreground/30" : "stroke-muted-foreground/10"}
            strokeWidth={db === 0 ? 1 : 0.5}
          />
          <text
            x={PAD.left - 4} y={dbToY(db) + 3}
            className="fill-muted-foreground" fontSize={8} textAnchor="end"
          >
            {db > 0 ? `+${db}` : db}
          </text>
        </g>
      ))}

      <defs>
        <clipPath id="iir-plot-clip">
          <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>

      <g clipPath="url(#iir-plot-clip)">
        <path d={iirFillPath(filter)} className="fill-primary/10" />
        <path
          d={iirResponsePath(filter)}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          opacity={0.8}
        />
      </g>
    </svg>
  );
}
