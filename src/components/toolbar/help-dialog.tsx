"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AudioWaveform, ExternalLink, Heart, ChevronDown, Keyboard } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AudioWaveform className="h-5 w-5 text-primary" />
            Patch Studio
          </DialogTitle>
          <DialogDescription>
            A visual tool for creating synthesized sounds as patches for the @web-kits/audio library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Build layered sounds with oscillators, noise, and wavetables. Shape them
            with filters, envelopes, LFOs, and effects — then export as JSON patches
            compatible with <span className="font-medium text-foreground">@web-kits/audio</span>.
          </p>
          <p>
            Use the timeline to arrange layers, the sidebar to tweak parameters,
            and the code preview to see your patch output in real time.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href="https://audio.raphaelsalaja.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              @web-kits/audio Documentation
            </a>
            <a
              href="https://github.com/CameronFoxly/patch-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Patch Studio on GitHub
            </a>
          </div>
        </div>

        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Heart className="h-3.5 w-3.5" />
            Open Source
          </p>
          <p className="mt-1">
            Patch Studio is MIT-licensed and open source. Bug reports, feature
            suggestions, and pull requests are welcome!
          </p>
          <a
            href="https://github.com/CameronFoxly/patch-studio/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open an Issue or Contribute
          </a>
        </div>

        <details className="group rounded-md border p-0 text-[10px] text-muted-foreground/60">
          <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground select-none list-none [&::-webkit-details-marker]:hidden">
            <Keyboard className="h-3.5 w-3.5" />
            Keyboard Shortcuts
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-3 gap-y-1 border-t px-3 py-2 max-h-32 overflow-y-auto">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">Space</kbd><span>Play / Stop</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">M</kbd><span>Mute Layer</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">L</kbd><span>Toggle Loop</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">S</kbd><span>Solo Layer</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">G</kbd><span>Toggle Grid</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">D</kbd><span>Duplicate</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">E</kbd><span>Envelope Overlay</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">N</kbd><span>Toggle Snap</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">⌫</kbd><span>Delete Layer</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">A</kbd><span>Add Layer</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">⌘ Z</kbd><span>Undo</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">+</kbd><span>Zoom In</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">⌘ ⇧ Z</kbd><span>Redo</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">−</kbd><span>Zoom Out</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">[</kbd><span>Set Range In</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-center">]</kbd><span>Set Range Out</span>
          </div>
        </details>
      </DialogContent>
    </Dialog>
  );
}
