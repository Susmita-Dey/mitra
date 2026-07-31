import type { Intent } from "@/types";
import type { CompanionEngine } from "@/app/companion-engine";
import type { WindowController } from "./window-controller";
import type { AudioSystem } from "./audio-system";

export interface ExecutorDependencies {
  engine: CompanionEngine;
  windowController?: WindowController;
  audioSystem?: AudioSystem;
}

export function executeIntents(intents: Intent[], deps: ExecutorDependencies) {
  for (const intent of intents) {
    // ── Character Intents ──────────────────────────────────────────────────
    if (intent.type === "ChangeEmotion") {
      // Handled directly by Brain currently, but could be handled here
    } else if (intent.type === "PlayAnimation") {
      deps.engine.setAnimation(intent.animation);
    } else if (intent.type === "SetInteraction") {
      deps.engine.setInteraction(intent.interaction);
    } else if (intent.type === "Greet") {
      deps.engine.setAnimation("wave");
      deps.engine.setEmotion("happy");
      deps.audioSystem?.playSound("greet");
    } else if (intent.type === "Celebrate") {
      deps.engine.setAnimation("idle"); // Wait, don't have a celebrate animation yet.
      deps.engine.setEmotion("happy");
      deps.audioSystem?.playSound("happy");
    } else if (intent.type === "Sleep") {
      deps.engine.setAnimation("sleep");
    } else if (intent.type === "Wake") {
      deps.engine.setAnimation("observe");
    } else if (intent.type === "Stretch") {
      deps.engine.setAnimation("stretch");
    } else if (intent.type === "Yawn") {
      deps.engine.setAnimation("yawn");
    } else if (intent.type === "LookAround") {
      deps.engine.setAnimation("look-around");
    } else if (intent.type === "Observe") {
      deps.engine.setAnimation("observe");
    } else if (intent.type === "AcknowledgeReminder") {
      deps.engine.setInteraction("none");
    }

    // ── Window Intents ─────────────────────────────────────────────────────
    else if (intent.type === "SnapToEdge") {
      deps.windowController?.snapToEdge().catch(console.error);
    } else if (intent.type === "MoveToTaskbar") {
      deps.windowController?.restorePosition().catch(console.error); // Restore goes to bottom right currently
    }

    // ── Audio Intents ──────────────────────────────────────────────────────
    else if (intent.type === "PlaySound") {
      deps.audioSystem?.playSound(intent.category);
    }
  }
}
