"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStore } from "@/lib/store";
import { exportPatch, downloadPatch } from "@/lib/audio/patch-converter";
import { Button } from "@/components/ui/button";
import { Code, Copy, Download, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { Highlighter } from "shiki";

export function CodePreview() {
  const layers = useStore((s) => s.layers);
  const globalEffects = useStore((s) => s.globalEffects);

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Build the patch JSON
  const patchJson = useMemo(() => {
    if (layers.length === 0) return "";
    const patch = exportPatch(
      "patch",
      layers,
      globalEffects.length > 0 ? globalEffects : undefined,
    );
    return JSON.stringify(patch, null, 2);
  }, [layers, globalEffects]);

  // Lazy-init the shiki highlighter (only when first expanded)
  useEffect(() => {
    if (!expanded || highlighter) return;
    let cancelled = false;

    import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-dark-default", "github-light-default"],
        langs: ["json"],
      }),
    ).then((hl) => {
      if (!cancelled) setHighlighter(hl);
    });

    return () => { cancelled = true; };
  }, [expanded, highlighter]);

  // Re-highlight whenever the JSON or highlighter changes
  useEffect(() => {
    if (!highlighter || !patchJson) {
      setHighlightedHtml("");
      return;
    }

    const html = highlighter.codeToHtml(patchJson, {
      lang: "json",
      themes: {
        dark: "github-dark-default",
        light: "github-light-default",
      },
    });
    setHighlightedHtml(html);
  }, [highlighter, patchJson]);

  const handleCopy = useCallback(async () => {
    if (!patchJson) return;
    await navigator.clipboard.writeText(patchJson);
    setCopied(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [patchJson]);

  const handleExport = useCallback(() => {
    if (layers.length === 0) return;
    const patch = exportPatch(
      "patch",
      layers,
      globalEffects.length > 0 ? globalEffects : undefined,
    );
    downloadPatch(patch);
  }, [layers, globalEffects]);

  return (
    <div className="border-t bg-background">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Code className="h-3.5 w-3.5" />
        <span className="font-medium">Patch Output</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t">
          {/* Actions bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1.5 text-xs px-2"
              onClick={handleCopy}
              disabled={!patchJson}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1.5 text-xs px-2"
              onClick={handleExport}
              disabled={layers.length === 0}
            >
              <Download className="h-3 w-3" />
              Export patch.json
            </Button>
          </div>

          {/* Code block */}
          <div className="max-h-64 overflow-auto">
            {!patchJson ? (
              <div className="px-4 py-6 text-xs text-muted-foreground text-center">
                Add a layer to see patch output
              </div>
            ) : highlightedHtml ? (
              <div
                className="text-xs [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0 [&_code]:!bg-transparent"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <pre className="text-xs p-4 font-mono text-muted-foreground whitespace-pre overflow-x-auto">
                {patchJson}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
