"use client";

import { useCallback, useRef } from "react";
import { defineSequence, ensureReady } from "@web-kits/audio";
import { useStore } from "@/lib/store";
import { layerToSoundDef } from "@/lib/audio/engine";
import type { SequenceStep as AudioSequenceStep } from "@web-kits/audio";

export function useSequenceEngine() {
  const stopFnRef = useRef<(() => void) | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveStepIndex = useStore((s) => s.setActiveStepIndex);

  const stop = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setActiveStepIndex(null);
  }, [setActiveStepIndex]);

  const play = useCallback(async () => {
    stop();
    await ensureReady();

    const state = useStore.getState();
    const { sequenceSteps, sequenceOptions, layers } = state;
    if (sequenceSteps.length === 0) return;

    // Build audio sequence steps with timing
    const audioSteps: AudioSequenceStep[] = [];
    let cumulativeTime = 0;

    for (const step of sequenceSteps) {
      // Determine the sound definition for this step
      let soundDef;
      if (step.layerId) {
        const layer = layers.find((l) => l.id === step.layerId);
        if (layer) {
          soundDef = layerToSoundDef(layer);
        }
      }

      // Fall back to inline sound if no layer matched
      if (!soundDef) {
        soundDef = step.sound && Object.keys(step.sound).length > 0
          ? step.sound
          : { source: { type: "sine" as const, frequency: 440 }, envelope: { decay: 0.2 } };
      }

      const waitTime = step.wait ?? 60 / (sequenceOptions.bpm ?? 120);

      audioSteps.push({
        sound: soundDef as any,
        at: cumulativeTime,
        volume: step.volume,
      });

      cumulativeTime += waitTime;
    }

    // Calculate total duration for looping
    const totalDuration = cumulativeTime;

    const playSequence = defineSequence(audioSteps, {
      loop: sequenceOptions.loop,
      duration: totalDuration,
    });

    const stopFn = playSequence();
    stopFnRef.current = stopFn ?? null;

    // Track active step for UI highlighting
    let currentStep = 0;
    setActiveStepIndex(0);

    function scheduleNextHighlight() {
      if (currentStep >= sequenceSteps.length - 1) {
        if (sequenceOptions.loop) {
          // Restart highlighting from beginning
          const lastWait = sequenceSteps[currentStep]?.wait ?? 60 / (sequenceOptions.bpm ?? 120);
          stepTimerRef.current = setTimeout(() => {
            currentStep = 0;
            setActiveStepIndex(0);
            scheduleNextHighlight();
          }, lastWait * 1000);
        }
        return;
      }

      const waitTime = sequenceSteps[currentStep]?.wait ?? 60 / (sequenceOptions.bpm ?? 120);
      stepTimerRef.current = setTimeout(() => {
        currentStep++;
        setActiveStepIndex(currentStep);
        scheduleNextHighlight();
      }, waitTime * 1000);
    }

    scheduleNextHighlight();
  }, [stop, setActiveStepIndex]);

  return { play, stop };
}
