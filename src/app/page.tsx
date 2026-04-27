"use client";

import { useCallback, useRef, useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Toolbar } from "@/components/toolbar/toolbar";
import { TransportBar } from "@/components/toolbar/transport-bar";
import { Timeline } from "@/components/timeline/timeline";
import { CodePreview } from "@/components/timeline/code-preview";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SequenceEditor } from "@/components/sequence/sequence-editor";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const SIDEBAR_DEFAULT = 280;
const SIDEBAR_MIN = 220;

export default function Home() {
  useKeyboardShortcuts();

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  const onSeparatorPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startW = sidebarWidth;

      const onMove = (ev: PointerEvent) => {
        const delta = startX - ev.clientX;
        setSidebarWidth(Math.max(SIDEBAR_MIN, startW + delta));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [sidebarWidth],
  );

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <TransportBar />
      <div className="flex flex-1 min-h-0">
        {/* Left column: timeline + code preview */}
        <div className="flex-1 min-w-0">
          <Group orientation="vertical" className="h-full">
            <Panel defaultSize={65} minSize={20}>
              <Timeline />
            </Panel>
            <Separator className="h-1.5 bg-border hover:bg-primary/20 transition-colors cursor-row-resize data-[resize-handle-active]:bg-primary/40" />
            <Panel defaultSize={35} minSize={5}>
              <CodePreview />
            </Panel>
          </Group>
        </div>

        {/* Custom fixed-pixel drag handle */}
        <div
          className="w-1.5 shrink-0 bg-border hover:bg-primary/20 transition-colors cursor-col-resize active:bg-primary/40"
          onPointerDown={onSeparatorPointerDown}
        />

        {/* Sidebar: fixed pixel width */}
        <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
