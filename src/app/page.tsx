"use client";

import { Panel, Group, Separator } from "react-resizable-panels";
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
      <Group orientation="vertical" className="flex-1 min-h-0">
        <Panel defaultSize={80} minSize={20}>
          <Group orientation="horizontal" className="h-full">
            <Panel minSize={10}>
              <Timeline />
            </Panel>
            <Separator className="w-1.5 bg-border hover:bg-primary/20 transition-colors cursor-col-resize data-[resize-handle-active]:bg-primary/40" />
            <Panel defaultSize={250} minSize={180}>
              <Sidebar />
            </Panel>
          </Group>
        </Panel>
        <Separator className="h-1.5 bg-border hover:bg-primary/20 transition-colors cursor-row-resize data-[resize-handle-active]:bg-primary/40" />
        <Panel defaultSize={0} minSize={3} collapsible>
          <SequenceEditor />
        </Panel>
      </Group>
    </div>
  );
}
