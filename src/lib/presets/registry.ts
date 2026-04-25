export interface PresetCollection {
  id: string;
  name: string;
  description: string;
  author: string;
  installCmd: string;
}

export const presetCollections: PresetCollection[] = [
  {
    id: "core",
    name: "Core",
    description:
      "Essential clicks, toggles, pops, notifications, and transitions",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch core",
  },
  {
    id: "retro",
    name: "Retro",
    description: "8-bit square waves and chiptune-inspired UI tones",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch retro",
  },
  {
    id: "mechanical",
    name: "Mechanical",
    description: "Tactile mechanical sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch mechanical",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, minimal UI sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch minimal",
  },
  {
    id: "crisp",
    name: "Crisp",
    description: "Sharp, precise interaction sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch crisp",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Natural, organic textures",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch organic",
  },
  {
    id: "drums",
    name: "Drums",
    description: "Drum and percussion sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch drums",
  },
  {
    id: "soft",
    name: "Soft",
    description: "Gentle, soft UI sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch soft",
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, playful interaction sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch playful",
  },
  {
    id: "synths",
    name: "Synths",
    description: "Synthesizer-based sounds",
    author: "Raphael Salaja",
    installCmd: "raphaelsalaja/audio --patch synths",
  },
];
