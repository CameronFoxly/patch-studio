"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AudioWaveform, ExternalLink } from "lucide-react";

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

        <div className="pt-2 text-[10px] text-muted-foreground/60">
          <p><strong>Shortcuts:</strong> Space = Play/Stop · ⌘Z = Undo · ⌘⇧Z = Redo</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
