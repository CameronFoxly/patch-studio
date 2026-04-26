# Patch Studio — Copilot Instructions

## Project Overview

Patch Studio is a visual sound design GUI for the `@web-kits/audio` library. It provides a DAW-style timeline with layered waveform visualization, a parameter sidebar with interactive EQ and envelope graphs, real-time playback with live parameter tweaking, and patch import/export. The app deploys as a static site to GitHub Pages.

**Repo**: `CameronFoxly/patch-studio` (private)
**Live**: GitHub Pages at `/patch-studio/`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, static export via `output: "export"`)
- **UI**: shadcn/ui v4.4.0, style `base-nova` (uses `@base-ui/react`, NOT Radix)
- **Styling**: Tailwind CSS v4 (uses `@theme inline {}` blocks, NOT `tailwind.config.js`)
- **State**: Zustand 5 with undo/redo via zundo 2
- **Audio**: `@web-kits/audio` — `defineSound()` + `play()` pattern
- **Icons**: Lucide React (not Nucleo/web-kits icons — those are paid)
- **Panels**: `react-resizable-panels` (uses `Panel`, `Group`, `Separator` — NOT `PanelGroup`/`PanelResizeHandle`)
- **Deploy**: GitHub Pages via `.github/workflows/deploy.yml`

## Build & Dev Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build (static export to out/)
npm run lint         # ESLint
```

Always run `npm run build` after changes to verify no errors. The build must pass cleanly.

## Architecture

```
src/
├── app/                    # Next.js App Router (page.tsx is the single page)
├── components/
│   ├── ui/                 # shadcn/ui components + SliderInput
│   ├── toolbar/            # Top bar: transport, presets, toolbar
│   ├── timeline/           # Timeline: layers, waveform canvas, envelope overlay, ruler
│   ├── sidebar/            # Parameter panels: source, filter, envelope, effects, etc.
│   ├── sequence/           # Step sequencer (future)
│   └── shared/             # Theme toggle, shared components
├── hooks/
│   ├── use-audio-engine.ts # Playback engine (rAF loop, retrigger throttle)
│   └── use-keyboard-shortcuts.ts
├── lib/
│   ├── audio/              # engine.ts (playSound), patch-converter.ts
│   ├── presets/             # registry.ts (metadata), loader.ts (fetch from public/)
│   ├── store/              # Zustand store with slices
│   │   ├── index.ts        # Store composition with temporal middleware
│   │   └── slices/         # layers.ts, timeline.ts, sequence.ts, ui.ts
│   ├── types/              # TypeScript types matching @web-kits/audio API
│   └── utils.ts            # cn() utility
public/
└── presets/                # 10 JSON preset collection files (252 sounds)
```

## Critical Technical Details

### shadcn/ui (base-nova style)
- Uses `@base-ui/react` components, NOT Radix primitives
- Component APIs may use `render` prop pattern
- `DropdownMenuSubTrigger` does NOT reliably forward custom event handlers
- Add new components with: `npx shadcn@latest add <component>`

### Tailwind CSS v4
- **CRITICAL**: Raw `:root`/`.dark` CSS blocks are stripped by Tailwind v4. Use `@theme inline {}` blocks instead.
- Font is set via `@theme inline { --font-sans: ... }`
- Built-in neutral theme provides color variables automatically
- No `tailwind.config.js` file — config is in CSS via `@theme`

### Zustand + zundo
- `useStore.temporal` is a `StoreApi`, NOT callable as a hook
- Must use `useZustandStore(useStore.temporal, selector)` for reactive subscriptions
- The `useTemporalState()` hook in `src/lib/store/index.ts` wraps this correctly
- Undo/redo only tracks `layers` and `sequence*` state (not transient UI/timeline)

### Audio Engine
- `@web-kits/audio` creates entire audio graphs per `defineSound()` + `play()` — no parameter patching on running sounds
- Live updates work via **throttled retrigger**: stop current voice, create new one (80ms cooldown)
- `isPlayingRef` guards against race conditions in async `triggerSound()`
- Animation loop reads `useStore.getState()` every frame for live `isLooping`/`regionStart`/`regionEnd`
- Spacebar always controls playback unless a text input is focused

### Waveform Rendering
- Uses **min/max decimation** (DAW-style) for consistent appearance across zoom levels
- Generates samples at 8kHz virtual sample rate, then decimates per pixel column
- Seeded PRNG (mulberry32) for stable noise rendering across redraws
- ResizeObserver triggers redraws when canvas size changes (zoom, window resize)
- Canvas clips to `roundRect` for rounded corners

### Envelope Overlay on Timeline
- SVG path uses `preserveAspectRatio="none"` for the envelope line (stretches with block)
- Control points are HTML `<div>` elements (NOT SVG circles) to avoid aspect ratio distortion
- Both waveform and overlay use identical `totalDuration = attack + decay + release + 0.5`

### Filter / EQ Graph
- Uses Audio EQ Cookbook biquad coefficient formulas for accurate frequency response curves
- Log-scale frequency axis (20Hz–20kHz), dB scale (-24 to +24)
- Shows source frequency spectrum as subtle background histogram
- Control points: X = frequency (log scale), Y = gain (peaking/shelf) or Q (other types)
- SVG hit areas render LAST (on top) so they always capture pointer events

### GitHub Pages Deployment
- `next.config.ts` conditionally sets `basePath`/`assetPrefix` when `DEPLOY_TARGET=gh-pages`
- `NEXT_PUBLIC_BASE_PATH` env var used in client-side fetch URLs (presets, assets)
- Preset fetches must use this prefix or they 404 on the `/patch-studio/` subpath

## Common Patterns

### Adding a new sidebar panel parameter
1. Add the field to the relevant type in `src/lib/types/`
2. Add store action in `src/lib/store/slices/layers.ts`
3. Use `<SliderInput>` component for numerical values (slider + editable text input)
4. For toggle groups with icons, follow the pattern in `source-panel.tsx`

### Adding a new effect type
1. Add the type to `src/lib/types/effects.ts`
2. Update `effects-panel.tsx` with controls
3. The audio engine passes effects through to `@web-kits/audio` via `layerToSoundDef()`

### Adding preset collections
1. Add the JSON file to `public/presets/`
2. Add metadata entry in `src/lib/presets/registry.ts`
3. The loader will auto-discover it

## @web-kits/audio API Reference

Docs: https://audio.raphaelsalaja.com/llms.txt

Key concepts:
- `defineSound(definition)` returns a play function
- Single layer: `{ source, filter?, envelope?, gain?, pan?, lfo?, effects? }`
- Multi-layer: `{ layers: [...], effects? }`
- Source types: sine, triangle, square, sawtooth, noise, wavetable
- Filter types: lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf
- Effects: reverb, delay, distortion, compressor, tremolo, chorus, bitcrusher, eq
- Envelope: { attack?, decay, sustain?, release? }
- LFO targets: frequency, detune, gain, pan, filter.frequency, filter.Q, etc.

## Style Guidelines

- Neutral, clean aesthetic — no flashy colors
- All numerical inputs use `SliderInput` (slider + editable text field)
- Interactive graphs use consistent control point style: visible dot → highlight ring → invisible hit area (rendered last for pointer events)
- Use Lucide icons throughout
- Keep components focused — one file per component
