import type { TimeOfDay } from "@/brain/core/types";

export type PropId = 
  | "prop-cookie"
  | "prop-apple"
  | "prop-pretzel"
  | "prop-juice"
  | "prop-lunchbox"
  | "prop-sandwich"
  | "prop-riceball"
  | "prop-soup"
  | "prop-dinnerplate"
  | "prop-toast"
  | "prop-cereal"
  | "prop-coffee"
  | "prop-water"
  | string;

export class PropManager {
  static getFoodProp(reminderType: string, timeOfDay: TimeOfDay): PropId {
    if (reminderType === "reminder:water") return "prop-water";
    
    if (reminderType === "reminder:snack") {
      const snacks = ["prop-cookie", "prop-apple", "prop-pretzel", "prop-juice"];
      return snacks[Math.floor(Math.random() * snacks.length)];
    }
    
    if (reminderType === "reminder:lunch") {
      const lunches = ["prop-lunchbox", "prop-sandwich", "prop-riceball"];
      return lunches[Math.floor(Math.random() * lunches.length)];
    }
    
    if (reminderType === "reminder:dinner") {
      const dinners = ["prop-soup", "prop-riceball", "prop-dinnerplate"];
      return dinners[Math.floor(Math.random() * dinners.length)];
    }

    if (reminderType === "reminder:breakfast") {
      const breakfasts = ["prop-toast", "prop-cereal"];
      if (timeOfDay === "Morning") {
        breakfasts.push("prop-coffee");
      }
      return breakfasts[Math.floor(Math.random() * breakfasts.length)];
    }
    
    return "prop-apple"; // Fallback
  }
}
