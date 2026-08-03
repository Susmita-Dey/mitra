/** How the user is currently engaging with the companion surface. */
export type Interaction = 
  | "none" 
  | "hover" 
  | "click"
  | "reminder:water"
  | "reminder:stretch"
  | "reminder:eyes"
  | "reminder:lunch"
  | "reminder:dinner"
  | "reminder:snack"
  | "reminder:meal"
  | "reminder:bio"
  | "drag" 
  | "weather:rain"
  | "weather:beach"
  | "weather:cloudy"
  | "ear-twitch"
  | "tail-flick"
  | "pet"
  | "tickle"
  | "high-five"
  | "poke"
  | "poke-alert"
  | "gentle-tap"
  | "idle"
  | `reminder:custom_${string}`
  | string;

export const DEFAULT_INTERACTION: Interaction = "idle";
