import type { Character } from "@/types";
import { PlaceholderRenderer } from "./PlaceholderRenderer";
import type { CharacterConfig } from "./types";

export interface CompanionProps {
  character: Character;
  /** Config injected by the host app reading the JSON manifest */
  config?: CharacterConfig;
}

const DEFAULT_CONFIG: CharacterConfig = {
  name: "Mitra (Default)",
  renderer: "placeholder",
  assets: {},
};

/**
 * Body Integration Layer.
 * Reads the character config and delegates to the correct renderer
 * (Rive, SVG, or Placeholder). The Engine state is passed through unmodified.
 */
export function Companion({ character, config = DEFAULT_CONFIG }: CompanionProps) {
  switch (config.renderer) {
    case "rive":
      // return <RiveRenderer character={character} config={config} />;
      return <PlaceholderRenderer character={character} config={config} />;
    
    case "svg":
      // return <SVGRenderer character={character} config={config} />;
      return <PlaceholderRenderer character={character} config={config} />;
      
    case "placeholder":
    default:
      return <PlaceholderRenderer character={character} config={config} />;
  }
}
