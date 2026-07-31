import type { EnvironmentSnapshot } from "@/system/environment";
import type { Character, AppPreferences } from "./index";
import type { CompanionMemory } from "@/brain/memory";
import type { BatteryState } from "@/system/battery-system";
import type { WeatherState } from "@/system/weather-system";
import type { MeetingState } from "@/system/meeting-system";

export type PresenceState = 
  | "Wander"
  | "Taskbar"
  | "AvoidFullscreen"
  | "Home"
  | "Peek"
  | "Hide"
  | "Sleep"
  | "FollowCursor"
  | "WatchCursor"
  | "Sitting"
  | "LyingDown"
  | "Yawning";

export interface WorldState {
  time: number;
  environment: EnvironmentSnapshot;
  character: Character;
  memory: Readonly<CompanionMemory>;
  presence: PresenceState;
  settings: Readonly<AppPreferences>;
  battery?: Readonly<BatteryState>;
  weather?: Readonly<WeatherState> | null;
  meeting?: Readonly<MeetingState>;
}
