import type { Intent } from "@/types";

export type CelebrationEvent = 
  | "TaskCompleted"
  | "GoalCompleted"
  | "ReminderAcknowledged"
  | "LongFocusSessionCompleted"
  | "BuildSucceeded"
  | "TestPassed"
  | "GitCommit";

export interface CelebrationEngine {
  /**
   * Handle a celebration event, returning intents to execute.
   */
  handleEvent(event: CelebrationEvent): Intent[];
}

export function createCelebrationEngine(): CelebrationEngine {
  return {
    handleEvent(event) {
      const intents: Intent[] = [];
      const rand = Math.random();

      // All celebrations boost emotion to happy
      intents.push({ type: "ChangeEmotion", emotion: "happy" });

      // Action based on event type
      switch (event) {
        case "GoalCompleted":
        case "LongFocusSessionCompleted":
          // Major celebration
          intents.push({ type: "Celebrate" });
          intents.push({ type: "PlaySound", category: "happy" });
          break;
        case "TaskCompleted":
        case "BuildSucceeded":
        case "TestPassed":
          // Moderate celebration
          if (rand > 0.5) {
            intents.push({ type: "Celebrate" });
          } else {
            intents.push({ type: "PlayAnimation", animation: "wave" });
          }
          intents.push({ type: "PlaySound", category: "happy" });
          break;
        case "GitCommit":
        case "ReminderAcknowledged":
          // Minor celebration
          intents.push({ type: "PlayAnimation", animation: "celebrate" });
          break;
      }

      return intents;
    }
  };
}
