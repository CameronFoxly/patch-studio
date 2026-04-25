"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toolbar } from "@/components/toolbar/toolbar";
import { TransportBar } from "@/components/toolbar/transport-bar";
import { Timeline } from "@/components/timeline/timeline";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SequenceEditor } from "@/components/sequence/sequence-editor";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Home() {
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <TransportBar />
      <PanelGroup direction="vertical" className="flex-1 min-h-0">
        <Panel defaultSize={75} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={70} minSize={30}>
              <Timeline />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/20 transition-colors cursor-col-resize" />
            <Panel defaultSize={30} minSize={15} maxSize={50}>
              <Sidebar />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1.5 bg-border hover:bg-primary/20 transition-colors cursor-row-resize" />
        <Panel defaultSize={25} minSize={5} maxSize={50} collapsible>
          <SequenceEditor />
        </Panel>
      </PanelGroup>
    </div>
  );
}
