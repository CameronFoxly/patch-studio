# Patch Studio

A web-based GUI for building synthesized sounds with the [`@web-kits/audio`](https://audio.raphaelsalaja.com) library. Design multi-layer sounds visually using a DAW-style timeline, tweak parameters in a sidebar, preview in real time, and export reusable patch files.

## Features

- **Timeline editor** — Layer-based timeline with draggable waveform blocks, zoom, and playhead scrubbing
- **Envelope overlay** — Visual ADSR curves drawn directly on audio regions with draggable control points
- **Parameter sidebar** — Source, filter, envelope, effects, modulation, spatial, and gain/pan controls per layer
- **Preset library** — 252 sounds across 10 collections from the `@web-kits/audio` patch registry
- **Playback** — Real-time audio preview with loop and region controls
- **Patch import/export** — Save and load `.json` patch files compatible with `@web-kits/audio`
- **Undo/redo** — Full state history with keyboard shortcuts
- **Dark/light mode** — Theme toggle with system preference detection

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router, static export)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) (base-nova style)
- [Zustand](https://zustand.docs.pmnd.rs) + [zundo](https://github.com/charkour/zundo) for state management
- [Lucide](https://lucide.dev) icons
- [@web-kits/audio](https://audio.raphaelsalaja.com) for sound synthesis

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building

```bash
# Production build (static export)
npm run build
```

The static site is output to the `out/` directory.

## Project Structure

```
src/
├── app/                  # Next.js app router (layout, page, globals.css)
├── components/
│   ├── toolbar/          # Top bar: transport, presets menu, file ops
│   ├── timeline/         # Timeline, layers, waveform canvas, envelope overlay
│   ├── sidebar/          # Parameter panels (source, filter, envelope, etc.)
│   ├── sequence/         # Step sequencer
│   └── ui/               # shadcn/ui primitives
├── hooks/                # Audio engine, keyboard shortcuts
└── lib/
    ├── audio/            # Playback engine, patch converter
    ├── presets/           # Preset registry and runtime loader
    ├── store/            # Zustand store and slices
    └── types/            # TypeScript type definitions
public/
└── presets/              # Patch JSON files (10 collections, 252 sounds)
```

## Deployment

The project auto-deploys to GitHub Pages on every push to `main` via the included GitHub Actions workflow. For Vercel deployment, deploy as-is — the `basePath` is only applied for GitHub Pages.

## License

MIT
