"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore, useTemporalState, temporalStore } from "@/lib/store";
import {
  exportPatch,
  downloadPatch,
  importPatch,
} from "@/lib/audio/patch-converter";
import { Undo2, Redo2, Download, Upload, FilePlus, Music } from "lucide-react";
import { PresetsMenu } from "./presets-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layers = useStore((s) => s.layers);
  const clearLayers = useStore((s) => s.clearLayers);
  const setLayers = useStore((s) => s.setLayers);
  const selectLayer = useStore((s) => s.selectLayer);

  const canUndo = useTemporalState((s) => s.pastStates.length > 0);
  const canRedo = useTemporalState((s) => s.futureStates.length > 0);

  const handleUndo = () => temporalStore.getState().undo();
  const handleRedo = () => temporalStore.getState().redo();

  const handleNew = () => {
    clearLayers();
    selectLayer(null);
  };

  const handleExport = () => {
    if (layers.length === 0) return;
    const patch = exportPatch("my-sound", layers);
    downloadPatch(patch);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const { layers: imported } = importPatch(json);
      setLayers(imported);
      if (imported.length > 0) {
        selectLayer(imported[0].id);
      }
    } catch (err) {
      console.error("Failed to import patch:", err);
    }

    // Reset input so the same file can be re-imported
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-card">
      {/* Logo / title */}
      <div className="flex items-center gap-2 mr-2">
        <Music className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">
          Audio Studio
        </span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* File operations */}
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNew} />}
        >
          <FilePlus className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>New patch</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImport} />}
        >
          <Upload className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Import patch</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleExport}
              disabled={layers.length === 0}
            />
          }
        >
          <Download className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Export patch</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <PresetsMenu />

      <Separator orientation="vertical" className="h-6" />

      {/* Undo / Redo */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleUndo()}
              disabled={!canUndo}
            />
          }
        >
          <Undo2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRedo()}
              disabled={!canRedo}
            />
          }
        >
          <Redo2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>

      <div className="flex-1" />
      <Separator orientation="vertical" className="h-6" />
      <ThemeToggle />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
