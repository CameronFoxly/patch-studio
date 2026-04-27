"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer, Effect, EffectType } from "@/lib/types";
import { PlusIcon, XIcon, ChevronDownIcon, ChevronRightIcon, PowerIcon } from "lucide-react";
import { EFFECT_TYPES, EFFECT_LABEL_MAP, defaultEffect, EffectParams } from "./effect-controls";

export function EffectsPanel({ layer }: { layer: Layer }) {
  const updateLayerEffects = useStore((s) => s.updateLayerEffects);
  const toggleLayerEffectBypass = useStore((s) => s.toggleLayerEffectBypass);
  const effects = layer.effects ?? [];
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function setEffects(next: Effect[]) {
    updateLayerEffects(layer.id, next);
  }

  function updateEffect(index: number, updated: Effect) {
    const next = [...effects];
    next[index] = updated;
    setEffects(next);
  }

  function removeEffect(index: number) {
    setEffects(effects.filter((_, i) => i !== index));
    setCollapsed((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addEffect(type: EffectType) {
    setEffects([...effects, defaultEffect(type)]);
  }

  function toggleCollapsed(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="space-y-3">
      {effects.length === 0 && (
        <p className="text-xs text-muted-foreground">No effects in chain</p>
      )}

      {effects.map((effect, i) => (
        <div key={i} className={`rounded-md border ${effect.bypassed ? "opacity-50" : ""}`}>
          <div
            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50"
            onClick={() => toggleCollapsed(i)}
          >
            <div className="flex items-center gap-1.5">
              {collapsed[i] ? (
                <ChevronRightIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
              <span className="text-xs font-medium">
                {EFFECT_LABEL_MAP[effect.type] ?? effect.type}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant={effect.bypassed ? "outline" : "ghost"}
                size="icon"
                className={`h-6 w-6 ${effect.bypassed ? "text-muted-foreground" : "text-primary"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerEffectBypass(layer.id, i);
                }}
                title={effect.bypassed ? "Enable effect" : "Bypass effect"}
              >
                <PowerIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEffect(i);
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {!collapsed[i] && (
            <div className="px-3 pb-3">
              <EffectParams
                effect={effect}
                onChange={(updated) => updateEffect(i, updated)}
              />
            </div>
          )}
        </div>
      ))}

      <Select
        onValueChange={(v) => {
          if (v) addEffect(v as EffectType);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add effect..." />
        </SelectTrigger>
        <SelectContent>
          {EFFECT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              <PlusIcon className="h-3 w-3 mr-1 inline" />
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
