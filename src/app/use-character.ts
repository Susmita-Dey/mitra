import { useSyncExternalStore } from "react";
import type { Character } from "@/types";
import { useCompanionEngine } from "./companion-context";

/** Subscribe to the live character snapshot from the Companion Engine. */
export function useCharacter(): Character {
  const engine = useCompanionEngine();

  return useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getCharacter(),
    () => engine.getCharacter(),
  );
}
