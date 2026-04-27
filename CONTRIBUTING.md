# Contributing to Patch Studio

Thanks for your interest in contributing to Patch Studio! This guide will help you get started.

## Getting Started

1. **Fork the repository** and clone your fork locally:

   ```bash
   git clone https://github.com/<your-username>/patch-studio.git
   cd patch-studio
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the dev server:**

   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

1. Create a branch from `main` for your changes:

   ```bash
   git checkout -b my-feature
   ```

2. Make your changes, then verify the build passes:

   ```bash
   npm run build
   npm run lint
   ```

3. Commit your changes with a clear, descriptive message.

4. Push your branch and open a pull request against `main`.

## Project Structure

See the [README](README.md) for an overview of the project structure and tech stack. For deeper architecture details, check [AGENTS.md](AGENTS.md).

## Code Style

- **TypeScript** — All code is written in TypeScript with strict mode enabled.
- **Components** — One component per file. Use functional components with hooks.
- **Styling** — Tailwind CSS v4 utility classes. Use `cn()` from `src/lib/utils.ts` for conditional class merging.
- **State** — Zustand store with slice pattern. Add new state to the appropriate slice in `src/lib/store/slices/`.
- **Icons** — Use [Lucide React](https://lucide.dev) icons exclusively.
- **UI primitives** — Use [shadcn/ui](https://ui.shadcn.com) components. Add new ones with `npx shadcn@latest add <component>`.

## Adding Features

### New sidebar parameter
1. Add the field to the relevant type in `src/lib/types/`
2. Add a store action in `src/lib/store/slices/layers.ts`
3. Use `<SliderInput>` for numerical values

### New effect type
1. Add the type to `src/lib/types/effects.ts`
2. Add controls in `src/components/sidebar/effects-panel.tsx`
3. The audio engine passes effects through via `layerToSoundDef()`

### New preset collection
1. Add the JSON file to `public/presets/`
2. Add a metadata entry in `src/lib/presets/registry.ts`

## Key Technical Notes

- **Build must pass** — `npm run build` produces a static export. PRs that break the build will not be merged.
- **shadcn/ui** uses `@base-ui/react` (not Radix) — component APIs may differ from what you expect.
- **Tailwind v4** — Use `@theme inline {}` blocks, not `:root`/`.dark` CSS blocks (they get stripped).
- **Audio** — `@web-kits/audio` creates full audio graphs per sound. Live parameter updates use throttled retrigger, not parameter patching. See the [audio docs](https://audio.raphaelsalaja.com/llms.txt).

## Reporting Issues

- Use [GitHub Issues](https://github.com/CameronFoxly/patch-studio/issues) to report bugs or request features.
- Include steps to reproduce, expected behavior, and actual behavior.
- Screenshots or screen recordings are very helpful for UI issues.

## Pull Requests

- Keep PRs focused — one feature or fix per PR.
- Include a clear description of what changed and why.
- Ensure `npm run build` and `npm run lint` pass before submitting.
- Link any related issues.

## License

By contributing to Patch Studio, you agree that your contributions will be licensed under the [MIT License](LICENSE).
