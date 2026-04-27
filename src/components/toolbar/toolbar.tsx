"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import {
  exportPatch,
  downloadPatch,
  importPatch,
} from "@/lib/audio/patch-converter";
import { Download, Upload, FilePlus, AudioWaveform, CircleHelp } from "lucide-react";
import { PresetsMenu } from "./presets-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ExportDialog } from "./export-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { HelpDialog } from "./help-dialog";

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const pendingFileRef = useRef<File | null>(null);

  const layers = useStore((s) => s.layers);
  const globalEffects = useStore((s) => s.globalEffects);
  const clearLayers = useStore((s) => s.clearLayers);
  const setLayers = useStore((s) => s.setLayers);
  const setGlobalEffects = useStore((s) => s.setGlobalEffects);
  const selectLayer = useStore((s) => s.selectLayer);
  const patchName = useStore((s) => s.patchName);
  const setPatchName = useStore((s) => s.setPatchName);

  const handleNew = () => {
    clearLayers();
    setGlobalEffects([]);
    selectLayer(null);
    setPatchName("Untitled");
  };

  const handleExport = (name: string) => {
    if (layers.length === 0) return;
    setPatchName(name);
    const patch = exportPatch(name, layers, globalEffects.length > 0 ? globalEffects : undefined);
    downloadPatch(patch);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If current state has work, ask for confirmation
    if (layers.length > 0) {
      pendingFileRef.current = file;
      setShowImportConfirm(true);
    } else {
      processImport(file);
    }

    // Reset input so the same file can be re-imported
    e.target.value = "";
  };

  const processImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const { layers: imported, globalEffects: importedGlobal } = importPatch(json);
      setLayers(imported);
      setGlobalEffects(importedGlobal);
      if (json.name) setPatchName(json.name);
      if (imported.length > 0) {
        selectLayer(imported[0].id);
      }
    } catch (err) {
      console.error("Failed to import patch:", err);
    }
  }, [setLayers, setGlobalEffects, selectLayer, setPatchName]);

  const handleImportConfirm = useCallback(() => {
    const file = pendingFileRef.current;
    if (file) {
      processImport(file);
      pendingFileRef.current = null;
    }
  }, [processImport]);

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setPatchName(val || "Untitled");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    // Prevent spacebar from triggering playback while editing title
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
      {/* Logo / title */}
      <div className="flex items-center gap-2">
        <AudioWaveform className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">
          Patch Studio for{" "}
          <a
            href="https://audio.raphaelsalaja.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            @web-kits/audio
          </a>
        </span>
      </div>

      <Separator orientation="vertical" className="self-stretch -my-2" />

      {/* New + Presets */}
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleNew}>
        <FilePlus className="h-4 w-4" />
        New
      </Button>
      <PresetsMenu />

      {/* Editable project title — centered */}
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          value={patchName}
          onChange={(e) => setPatchName(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          spellCheck={false}
          className="text-sm font-medium text-center bg-transparent border-none outline-none w-48 px-2 py-1 rounded hover:bg-muted focus:bg-muted focus:ring-1 focus:ring-ring transition-colors"
        />
      </div>

      {/* Import / Export */}
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleImportClick}>
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => layers.length > 0 && setShowExport(true)}
        disabled={layers.length === 0}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Separator orientation="vertical" className="self-stretch -my-2" />
      <ThemeToggle />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHelp(true)}>
        <CircleHelp className="h-4 w-4" />
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Export dialog */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        onExport={handleExport}
        defaultName={patchName}
      />

      {/* Import confirmation dialog */}
      <ConfirmDialog
        open={showImportConfirm}
        onOpenChange={(open) => {
          setShowImportConfirm(open);
          if (!open) pendingFileRef.current = null;
        }}
        onConfirm={handleImportConfirm}
        title="Replace current patch?"
        description="Importing will replace your current layers and effects. This action can be undone."
      />

      {/* Help dialog */}
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
