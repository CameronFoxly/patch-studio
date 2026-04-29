"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderInput } from "@/components/ui/slider-input";
import { Loader2 } from "lucide-react";

export type ExportFormat = "json" | "wav" | "mp3";

export interface ExportOptions {
  format: ExportFormat;
  name: string;
  duration?: number;
  sampleRate?: number;
  bitrate?: number;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void> | void;
  defaultName?: string;
  defaultDuration?: number;
}

const SAMPLE_RATES = [22050, 44100, 48000] as const;
const BITRATES = [128, 192, 256, 320] as const;

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  defaultName = "my-sound",
  defaultDuration = 2,
}: ExportDialogProps) {
  const [name, setName] = useState(defaultName);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [duration, setDuration] = useState(defaultDuration);
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitrate, setBitrate] = useState(192);
  const [rendering, setRendering] = useState(false);

  const prevOpen = useRef(false);
  if (open && !prevOpen.current) {
    prevOpen.current = true;
    if (defaultName !== name) setName(defaultName);
    setDuration(defaultDuration);
    setRendering(false);
  }
  if (!open) prevOpen.current = false;

  const handleExport = async () => {
    const trimmed = name.trim() || "my-sound";
    setRendering(true);
    try {
      await onExport({
        format,
        name: trimmed,
        duration,
        sampleRate,
        bitrate,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setRendering(false);
    }
  };

  const isAudio = format !== "json";

  const formatDescription: Record<ExportFormat, string> = {
    json: "Export your patch as a JSON file compatible with @web-kits/audio.",
    wav: "Render your patch to an uncompressed WAV audio file (16-bit PCM).",
    mp3: "Render your patch to a compressed MP3 audio file.",
  };

  return (
    <Dialog open={open} onOpenChange={rendering ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Patch</DialogTitle>
          <DialogDescription>{formatDescription[format]}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="json" disabled={rendering}>JSON</TabsTrigger>
            <TabsTrigger value="wav" disabled={rendering}>WAV</TabsTrigger>
            <TabsTrigger value="mp3" disabled={rendering}>MP3</TabsTrigger>
          </TabsList>

          {/* Shared name input */}
          <div className="mt-3 space-y-2">
            <Label htmlFor="patch-name" className="text-xs">File Name</Label>
            <Input
              id="patch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-sound"
              disabled={rendering}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !rendering) handleExport();
              }}
              autoFocus
            />
          </div>

          {/* Audio-specific controls for WAV and MP3 */}
          <TabsContent value="wav">
            <AudioControls
              duration={duration}
              sampleRate={sampleRate}
              onDurationChange={setDuration}
              onSampleRateChange={setSampleRate}
              disabled={rendering}
            />
          </TabsContent>

          <TabsContent value="mp3">
            <AudioControls
              duration={duration}
              sampleRate={sampleRate}
              onDurationChange={setDuration}
              onSampleRateChange={setSampleRate}
              disabled={rendering}
            />
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Bitrate</Label>
              <Select
                value={String(bitrate)}
                onValueChange={(v) => setBitrate(Number(v))}
                disabled={rendering}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BITRATES.map((br) => (
                    <SelectItem key={br} value={String(br)}>
                      {br} kbps
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* JSON tab has no additional controls */}
          <TabsContent value="json" />
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rendering}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={rendering}>
            {rendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering…
              </>
            ) : (
              isAudio ? `Export .${format}` : "Export .json"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AudioControls({
  duration,
  sampleRate,
  onDurationChange,
  onSampleRateChange,
  disabled,
}: {
  duration: number;
  sampleRate: number;
  onDurationChange: (v: number) => void;
  onSampleRateChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className={disabled ? "pointer-events-none opacity-50" : ""}>
        <SliderInput
          label="Duration"
          value={duration}
          min={0.1}
          max={30}
          step={0.1}
          unit="s"
          onChange={onDurationChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Sample Rate</Label>
        <Select
          value={String(sampleRate)}
          onValueChange={(v) => onSampleRateChange(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_RATES.map((sr) => (
              <SelectItem key={sr} value={String(sr)}>
                {(sr / 1000).toFixed(1)} kHz
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
