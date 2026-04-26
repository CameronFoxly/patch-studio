"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X } from "lucide-react";

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
}

export function PianoKeyboardDialog({
  open,
  onClose,
  currentFrequency,
  onNoteSelect,
}: PianoKeyboardDialogProps) {
  const [octave, setOctave] = useState(() => {
    const midi = frequencyToMidi(currentFrequency);
    return Math.max(0, Math.min(8, Math.floor(midi / 12) - 1));
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const hasPositioned = useRef(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Center dialog on first open
  useEffect(() => {
    if (open && !hasPositioned.current) {
      setPosition({
        x: Math.max(16, (window.innerWidth - 304) / 2),
        y: Math.max(16, (window.innerHeight - 260) / 2),
      });
      hasPositioned.current = true;
    }
  }, [open]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPosition({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleKeyClick = useCallback(
    (noteIndex: number) => {
      const midi = midiNoteNumber(noteIndex, octave);
      onNoteSelect(midiToFrequency(midi));
    },
    [octave, onNoteSelect]
  );

  const currentMidi = frequencyToMidi(currentFrequency);
  const currentNoteIndex = currentMidi % 12;
  const currentNoteOctave = Math.floor(currentMidi / 12) - 1;

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-50 w-[304px] rounded-xl bg-popover p-3 text-popover-foreground ring-1 ring-foreground/10 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      {/* Draggable title bar */}
      <div
        className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
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
                    : "bg-background border-border hover:bg-muted text-muted-foreground"
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
                  : "bg-foreground border border-foreground/80 hover:bg-foreground/80"
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
