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
import type { Effect, EffectType } from "@/lib/types";
import { PlusIcon, XIcon, ChevronDownIcon, ChevronRightIcon, PowerIcon } from "lucide-react";
import { EFFECT_TYPES, EFFECT_LABEL_MAP, defaultEffect, EffectParams } from "./effect-controls";

export function GlobalEffectsPanel() {
  const globalEffects = useStore((s) => s.globalEffects);
  const addGlobalEffect = useStore((s) => s.addGlobalEffect);
  const updateGlobalEffect = useStore((s) => s.updateGlobalEffect);
  const removeGlobalEffect = useStore((s) => s.removeGlobalEffect);
  const toggleGlobalEffectBypass = useStore((s) => s.toggleGlobalEffectBypass);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function toggleCollapsed(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Effects applied to the master bus after all layers are mixed.
      </p>

      {globalEffects.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No master effects
        </p>
      )}

      {globalEffects.map((effect, i) => (
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
                  toggleGlobalEffectBypass(i);
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
                  removeGlobalEffect(i);
                  setCollapsed((prev) => {
                    const next = { ...prev };
                    delete next[i];
                    return next;
                  });
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
                onChange={(updated) => updateGlobalEffect(i, updated)}
              />
            </div>
          )}
        </div>
      ))}

      <Select
        onValueChange={(v) => {
          if (v) addGlobalEffect(defaultEffect(v as EffectType));
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add master effect..." />
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
