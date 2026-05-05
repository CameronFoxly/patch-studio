"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { useSidebarContainer } from "@/components/sidebar/sidebar-context";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// White key chromatic indices: C=0, D=2, E=4, F=5, G=7, A=9, B=11
const WHITE_INDICES = [0, 2, 4, 5, 7, 9, 11];

// Black keys: chromatic index + which white key boundary they sit on
const BLACK_KEYS = [
  { noteIndex: 1, afterWhiteKey: 0 }, // C#
  { noteIndex: 3, afterWhiteKey: 1 }, // D#
  { noteIndex: 6, afterWhiteKey: 3 }, // F#
  { noteIndex: 8, afterWhiteKey: 4 }, // G#
  { noteIndex: 10, afterWhiteKey: 5 }, // A#
];

function midiToFrequency(midi: number): number {
  return Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
}

function frequencyToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

function midiNoteNumber(noteIndex: number, octave: number): number {
  return (octave + 1) * 12 + noteIndex;
}

interface PianoKeyboardDialogProps {
  open: boolean;
  onClose: () => void;
  currentFrequency: number;
  onNoteSelect: (frequency: number) => void;
  onNotePreview?: (frequency: number) => void;
}

export function PianoKeyboardDialog({
  open,
  onClose,
  currentFrequency,
  onNoteSelect,
  onNotePreview,
}: PianoKeyboardDialogProps) {
  const [octave, setOctave] = useState(() => {
    const midi = frequencyToMidi(currentFrequency);
    return Math.max(0, Math.min(8, Math.floor(midi / 12) - 1));
  });

  const sidebarRef = useSidebarContainer();
  const [anchorRight, setAnchorRight] = useState(0);
  const [phase, setPhase] = useState<"closed" | "entering" | "exiting">("closed");

  // Drive enter/exit phase from the open prop
  useEffect(() => {
    if (open) {
      setPhase("entering");
    } else if (phase !== "closed") {
      setPhase("exiting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAnimationEnd = useCallback(() => {
    if (phase === "exiting") {
      setPhase("closed");
    }
  }, [phase]);

  // Track sidebar position so the picker stays anchored on resize
  useEffect(() => {
    if (phase === "closed" || !sidebarRef?.current) return;

    const update = () => {
      const el = sidebarRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setAnchorRight(window.innerWidth - r.left);
      }
    };

    update();
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(sidebarRef.current);

    return () => {
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [phase, sidebarRef]);

  const handleKeyClick = useCallback(
    (noteIndex: number) => {
      const midi = midiNoteNumber(noteIndex, octave);
      const freq = midiToFrequency(midi);
      onNoteSelect(freq);
      onNotePreview?.(freq);
    },
    [octave, onNoteSelect, onNotePreview]
  );

  const currentMidi = frequencyToMidi(currentFrequency);
  const currentNoteIndex = currentMidi % 12;
  const currentNoteOctave = Math.floor(currentMidi / 12) - 1;

  if (phase === "closed" || typeof document === "undefined") return null;

  const animClass = phase === "entering" ? "animate-slide-left" : "animate-slide-right";

  return createPortal(
    <div
      className={`fixed z-30 w-[304px] rounded-md bg-popover p-3 text-popover-foreground ring-1 ring-foreground/10 shadow-lg ${animClass}`}
      style={{ bottom: 8, right: anchorRight + 8 }}
      onAnimationEnd={handleAnimationEnd}
    >      {/* Title bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Note Picker</span>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-3" />
        </Button>
      </div>

      {/* Octave controls */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Octave {octave}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setOctave(Math.max(0, octave - 1))}
            disabled={octave <= 0}
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setOctave(Math.min(8, octave + 1))}
            disabled={octave >= 8}
          >
            <ChevronUp className="size-3" />
          </Button>
        </div>
      </div>

      {/* Piano keyboard */}
      <div className="relative h-24 select-none">
        {/* White keys */}
        <div className="flex h-full gap-0.5">
          {WHITE_INDICES.map((noteIndex) => {
            const midi = midiNoteNumber(noteIndex, octave);
            const isActive = currentMidi === midi;
            return (
              <button
                key={noteIndex}
                type="button"
                onClick={() => handleKeyClick(noteIndex)}
                className={`flex-1 rounded-b-md border transition-colors cursor-pointer flex flex-col items-center justify-end pb-1 ${
                  isActive
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-500 dark:border-neutral-400 dark:hover:bg-neutral-200 dark:text-neutral-400"
                }`}
                title={`${NOTE_NAMES[noteIndex]}${octave} — ${midiToFrequency(midi)} Hz`}
              >
                <span className="text-[9px] leading-none font-mono">
                  {NOTE_NAMES[noteIndex]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Black keys */}
        {BLACK_KEYS.map(({ noteIndex, afterWhiteKey }) => {
          const midi = midiNoteNumber(noteIndex, octave);
          const isActive = currentMidi === midi;
          const whiteKeyWidth = 100 / 7;
          const blackKeyWidth = whiteKeyWidth * 0.65;
          const left =
            (afterWhiteKey + 1) * whiteKeyWidth - blackKeyWidth / 2;

          return (
            <button
              key={noteIndex}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleKeyClick(noteIndex);
              }}
              className={`absolute top-0 h-[58%] rounded-b-md transition-colors cursor-pointer z-10 ${
                isActive
                  ? "bg-primary text-primary-foreground border border-primary"
                  : "bg-neutral-900 border border-neutral-800 hover:bg-neutral-700 dark:bg-neutral-950 dark:border-neutral-800 dark:hover:bg-neutral-800"
              }`}
              style={{ left: `${left}%`, width: `${blackKeyWidth}%` }}
              title={`${NOTE_NAMES[noteIndex]}${octave} — ${midiToFrequency(midi)} Hz`}
            />
          );
        })}
      </div>

      {/* Current note display */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>
          {NOTE_NAMES[currentNoteIndex]}
          {currentNoteOctave}
        </span>
        <span>{currentFrequency} Hz</span>
      </div>
    </div>,
    document.body
  );
}
