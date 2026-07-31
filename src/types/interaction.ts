/** How the user is currently engaging with the companion surface. */
export type Interaction = 
  | "none" 
  | "hover" 
  | "click"
  | "reminder:water"
  | "reminder:stretch"
  | "reminder:eyes"
  | "reminder:lunch"
  | "drag" 
  | "state:sick"
  | "weather:rain"
  | "weather:beach"
  | "weather:cloudy"
  | "idle";

export const DEFAULT_INTERACTION: Interaction = "idle";
