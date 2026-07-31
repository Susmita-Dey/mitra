import type { EnvironmentSnapshot } from "@/system/environment";
import type { Character, AppPreferences } from "./index";
import type { CompanionMemory } from "@/brain/memory";

export type PresenceState = 
  | "Wander"
  | "Taskbar"
  | "AvoidFullscreen"
  | "Home"
  | "Peek"
  | "Sleep";

export interface WorldState {
  time: number;
  environment: EnvironmentSnapshot;
  character: Character;
  memory: Readonly<CompanionMemory>;
  presence: PresenceState;
  settings: Readonly<AppPreferences>;
}
