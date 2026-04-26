# Copilot Instructions for Patch Studio

Read `AGENTS.md` at the repo root for the full project guide — architecture, tech stack, gotchas, and patterns.

## Quick Reference

- **Stack**: Next.js 16, Tailwind v4, shadcn/ui (base-nova / @base-ui/react), Zustand 5 + zundo, @web-kits/audio
- **Build**: `npm run build` (static export) — must always pass
- **Deploy**: GitHub Pages via Actions (`.github/workflows/deploy.yml`)
- **Audio docs**: https://audio.raphaelsalaja.com/llms.txt

## Top Gotchas

1. shadcn uses `@base-ui/react` NOT Radix — check component APIs
2. Tailwind v4 strips `:root`/`.dark` CSS blocks — use `@theme inline {}`
3. `react-resizable-panels` uses `Panel`/`Group`/`Separator` (not PanelGroup/PanelResizeHandle)
4. Zustand temporal: use `useZustandStore(useStore.temporal, selector)`, not `useStore.temporal(selector)`
5. SVG interactive elements: render hit areas LAST (topmost catches events)
6. GitHub Pages: prefix fetch URLs with `process.env.NEXT_PUBLIC_BASE_PATH`
7. Audio engine: throttle retriggers (not debounce) for live parameter updates
