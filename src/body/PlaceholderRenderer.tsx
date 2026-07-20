import type { RendererProps } from "./types";
import "./Companion.css";

/**
 * Fallback renderer when no assets are present.
 * Renders the canonical Phase 1 dashed circle.
 */
export function PlaceholderRenderer({ character }: RendererProps) {
  return (
    <div
      className="companion"
      data-animation={character.animation}
      data-emotion={character.emotion}
      data-interaction={character.interaction}
    >
      <div
        className="companion__placeholder"
        role="img"
        aria-label="Mitra companion placeholder"
      />
    </div>
  );
}
