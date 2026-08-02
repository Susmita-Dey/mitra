import type { Intent } from "@/types";

export type CelebrationEvent = 
  | "TaskCompletedSmall"
  | "TaskCompletedBig"
  | "Birthday"
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

      switch (event) {
        case "Birthday":
          // Grand Bash!
          intents.push({ type: "Celebrate" });
          intents.push({ type: "SetProceduralState", state: { props: ["birthday-hat", "birthday-cake"] } });
          intents.push({ type: "SetBubble", text: "HAPPY BIRTHDAY!! Let's eat cake! 🎂", duration: 15000 });
          break;
        case "GoalCompleted":
        case "TaskCompletedBig":
        case "LongFocusSessionCompleted":
          // Major celebration
          intents.push({ type: "Celebrate" });
          intents.push({ type: "PlaySound", category: "applause" });
          break;
        case "BuildSucceeded":
        case "TestPassed":
          if (rand > 0.5) {
            intents.push({ type: "Celebrate" });
            intents.push({ type: "PlaySound", category: "wow" });
          } else {
            intents.push({ type: "Greet" }); // Wave equivalent sequence
            intents.push({ type: "PlaySound", category: "chirps" });
          }
          break;
        case "TaskCompletedSmall":
        case "GitCommit":
        case "ReminderAcknowledged":
          // Minor celebration
          intents.push({ type: "PlayAnimation", animation: "look-around" });
          intents.push({ type: "PlaySound", category: "happy" });
          break;
      }

      return intents;
    }
  };
}
