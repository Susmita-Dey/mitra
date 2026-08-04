import type { Intent } from "@/types";
import type { CompanionEngine } from "@/app/companion-engine";
import type { WindowController } from "./window-controller";
import type { AudioSystem } from "./audio-system";

export interface ExecutorDependencies {
  engine: CompanionEngine;
  windowController?: WindowController;
  audioSystem?: AudioSystem;
}

// ---------------------------------------------------------------------------
// Visibility guard
// ---------------------------------------------------------------------------
// The presence engine emits HideWindow/ShowWindow on every brain tick when
// inMeeting === true (or false). Without a guard these fire IPC commands
// 1×/second even when the window state has not changed.
//
// On Windows with transparent + undecorated WebView2 windows, repeated
// hide/show IPC calls — especially concurrent ones from Rust tray and JS —
// cause the compositor to flash a solid black rectangle.
//
// We track intended visibility here so each IPC call is only issued once
// per actual state transition. This complements the IPC serial queue in
// WindowController which serializes the calls themselves.
// ---------------------------------------------------------------------------
let intendedHidden = false;

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
      deps.engine.setAnimation("celebrate");
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
      deps.windowController?.restorePosition().catch(console.error);
    } else if (intent.type === "HideWindow") {
      // Guard: only issue IPC if not already hidden.
      // Repeated hide calls on a transparent WebView2 window cause black flashes.
      if (!intendedHidden) {
        intendedHidden = true;
        // Disable click-through BEFORE hiding to prevent WebView2 compositor
        // from painting the transparent window as a black rectangle.
        deps.windowController?.setIgnoreCursorEvents(false)
          .catch(console.error)
          .finally(() => {
            deps.windowController?.hide().catch(console.error);
          });
      }
    } else if (intent.type === "ShowWindow") {
      // Guard: only issue IPC if currently hidden.
      if (intendedHidden) {
        intendedHidden = false;
        deps.windowController?.show().catch(console.error);
      }
    }

    // ── Audio Intents ──────────────────────────────────────────────────────
    else if (intent.type === "PlaySound") {
      deps.audioSystem?.playSound(intent.category, intent.emotion);
    }
  }
}

/**
 * Sync the visibility guard with external events (tray hide/show).
 * Must be called whenever the window is hidden or shown outside of executeIntents
 * (e.g. from the system tray menu handler).
 */
export function syncVisibilityState(isHidden: boolean) {
  intendedHidden = isHidden;
}
