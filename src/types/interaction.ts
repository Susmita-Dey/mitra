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
  | "state:sick"
  | "weather:rain"
  | "weather:beach"
  | "weather:cloudy"
  | "ear-twitch"
  | "tail-flick"
  | "pet"
  | "tickle"
  | "high-five"
  | "poke-annoyed"
  | "poke-alert"
  | "gentle-tap"
  | "idle";

export const DEFAULT_INTERACTION: Interaction = "idle";
