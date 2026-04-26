# Patch Studio — Claude Instructions

@AGENTS.md

## Additional Notes for Claude

### Before making changes
- Run `npm run build` to establish baseline
- Read the relevant type definitions in `src/lib/types/` before modifying store or components
- Check `@web-kits/audio` docs at https://audio.raphaelsalaja.com/llms.txt for audio API questions

### Key gotchas to remember
1. **Tailwind v4** strips raw `:root`/`.dark` CSS — use `@theme inline {}` blocks
2. **shadcn base-nova** uses `@base-ui/react`, NOT Radix — component APIs differ
3. **react-resizable-panels** uses `Panel`/`Group`/`Separator` — NOT `PanelGroup`/`PanelResizeHandle`
4. **Zustand temporal**: `useStore.temporal` is `StoreApi`, use `useZustandStore()` wrapper
5. **SVG hit areas**: Always render interactive circles/elements LAST in SVG (topmost = receives events)
6. **Envelope overlay**: Control points are HTML divs, NOT SVG circles (avoids `preserveAspectRatio="none"` distortion)
7. **GitHub Pages**: All client-side fetches must prefix URLs with `NEXT_PUBLIC_BASE_PATH`
8. **Audio retrigger**: Use throttle (not debounce) for live parameter updates during playback
9. **Next.js 16**: Read docs in `node_modules/next/dist/docs/` — APIs may differ from training data

### After making changes
- Always run `npm run build` and verify it passes
- Test that spacebar still controls playback (not UI widgets)
- If modifying audio/playback code, verify stop button can always halt playback
