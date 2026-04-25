"use client";

import { useStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourcePanel } from "./source-panel";
import { FilterPanel } from "./filter-panel";
import { EnvelopePanel } from "./envelope-panel";
import { EffectsPanel } from "./effects-panel";
import { ModulationPanel } from "./modulation-panel";
import { SpatialPanel } from "./spatial-panel";
import { GainPanPanel } from "./gain-pan-panel";

export function Sidebar() {
  const activeSidebarPanel = useStore((s) => s.activeSidebarPanel);
  const setActiveSidebarPanel = useStore((s) => s.setActiveSidebarPanel);
  const layer = useStore((s) =>
    s.layers.find((l) => l.id === s.selectedLayerId),
  );

  if (!layer) {
    return (
      <div className="w-80 border-l bg-card flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground text-center">
          Select a layer to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm truncate">{layer.name}</h2>
      </div>
      <Tabs
        value={activeSidebarPanel}
        onValueChange={(v) => {
          if (v) setActiveSidebarPanel(v as typeof activeSidebarPanel);
        }}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-2 border-b">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-1">
            <TabsTrigger value="source" className="text-xs px-2 py-1">
              Source
            </TabsTrigger>
            <TabsTrigger value="filter" className="text-xs px-2 py-1">
              Filter
            </TabsTrigger>
            <TabsTrigger value="envelope" className="text-xs px-2 py-1">
              Envelope
            </TabsTrigger>
            <TabsTrigger value="effects" className="text-xs px-2 py-1">
              Effects
            </TabsTrigger>
            <TabsTrigger value="modulation" className="text-xs px-2 py-1">
              LFO
            </TabsTrigger>
            <TabsTrigger value="spatial" className="text-xs px-2 py-1">
              Spatial
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="source" className="mt-0">
              <SourcePanel layer={layer} />
            </TabsContent>
            <TabsContent value="filter" className="mt-0">
              <FilterPanel layer={layer} />
            </TabsContent>
            <TabsContent value="envelope" className="mt-0">
              <EnvelopePanel layer={layer} />
            </TabsContent>
            <TabsContent value="effects" className="mt-0">
              <EffectsPanel layer={layer} />
            </TabsContent>
            <TabsContent value="modulation" className="mt-0">
              <ModulationPanel layer={layer} />
            </TabsContent>
            <TabsContent value="spatial" className="mt-0">
              <SpatialPanel layer={layer} />
            </TabsContent>
          </div>
        </ScrollArea>
        <GainPanPanel layer={layer} />
      </Tabs>
    </div>
  );
}
