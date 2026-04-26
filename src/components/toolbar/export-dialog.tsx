"use client";

import { useState } from "react";
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

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (name: string) => void;
}

export function ExportDialog({ open, onOpenChange, onExport }: ExportDialogProps) {
  const [name, setName] = useState("my-sound");

  const handleExport = () => {
    const trimmed = name.trim() || "my-sound";
    onExport(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Patch</DialogTitle>
          <DialogDescription>
            Export your patch as a JSON file compatible with @web-kits/audio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="patch-name" className="text-xs">Patch Name</Label>
          <Input
            id="patch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-sound"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleExport();
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
