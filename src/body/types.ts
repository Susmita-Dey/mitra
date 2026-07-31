import type { Character } from "@/types";

/**
 * Character manifest loaded from assets/characters/<name>/character.json.
 * Defines how the engine state maps to the visual assets.
 */
export interface CharacterConfig {
  name: string;
  renderer: "rive" | "svg" | "mock";
  assets: {
    rive?: string;
    svg?: string;
  };
}

/**
 * Contract for all rendering backends.
 * Whether we render via Rive Canvas, DOM SVGs, or a placeholder,
 * the component must accept this shape.
 */
export interface RendererProps {
  character: Character;
  config: CharacterConfig;
}
