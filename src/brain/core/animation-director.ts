import { EmotionState, ProceduralAnimationState } from "./types";
import { EmotionEngine } from "./emotion-engine";

export type DirectorPriority = 
  | "CriticalReminder"
  | "MeetingSummary"
  | "Interaction"
  | "Reminder"
  | "Idle";

export interface ActiveSequence {
  id: string;
  priority: DirectorPriority;
  animationOverrides?: Partial<ProceduralAnimationState>;
  speechBubble?: string;
  durationMs?: number;
  startedAt: number;
}

export interface AnimationDirector {
  tick(
    now: number,
    emotion: EmotionState,
    emotionEngine: EmotionEngine,
    setRenderState: (anim: ProceduralAnimationState, bubble: string | null, interactionId: string | null) => void
  ): void;
  
  queueSequence(sequence: Omit<ActiveSequence, "startedAt">): void;
  clearSequence(id: string): void;
}

export function createAnimationDirector(): AnimationDirector {
  let activeSequence: ActiveSequence | null = null;
  const queue: Omit<ActiveSequence, "startedAt">[] = [];

  const priorityWeight: Record<DirectorPriority, number> = {
    CriticalReminder: 100,
    MeetingSummary: 80,
    Interaction: 60,
    Reminder: 40,
    Idle: 0
  };

  return {
    queueSequence(seq) {
      if (activeSequence?.id === seq.id) {
        return; // Already active
      }
      
      const existingIdx = queue.findIndex(q => q.id === seq.id);
      if (existingIdx !== -1) {
        return; // Already in queue
      }

      if (!activeSequence || priorityWeight[seq.priority] > priorityWeight[activeSequence.priority]) {
        // Preempt current
        if (activeSequence && activeSequence.priority !== "Idle") {
           queue.push({ ...activeSequence });
        }
        activeSequence = { ...seq, startedAt: Date.now() };
      } else {
        queue.push(seq);
        // Sort queue by priority
        queue.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      }
    },

    clearSequence(id) {
      if (activeSequence?.id === id) {
        activeSequence = null;
      }
      // Remove all instances from queue (in case there were dupes previously)
      for (let i = queue.length - 1; i >= 0; i--) {
         if (queue[i].id === id) {
            queue.splice(i, 1);
         }
      }
    },

    tick(now, emotion, emotionEngine, setRenderState) {
      // 1. Check if active sequence expired
      if (activeSequence && activeSequence.durationMs && now - activeSequence.startedAt > activeSequence.durationMs) {
        activeSequence = null;
      }

      // 2. Promote from queue if idle
      if (!activeSequence && queue.length > 0) {
        const next = queue.shift()!;
        activeSequence = { ...next, startedAt: now };
      }

      // 3. Derive base procedural state from emotion
      const isInteracting = activeSequence?.priority === "Interaction";
      const baseAnim = emotionEngine.deriveAnimation(emotion, isInteracting);

      // 4. Apply sequence overrides
      const finalAnim: ProceduralAnimationState = {
        ...baseAnim,
        ...(activeSequence?.animationOverrides || {})
      };
      
      const bubble = activeSequence?.speechBubble || null;

      // 5. Output to renderer
      setRenderState(finalAnim, bubble, activeSequence?.id || null);
    }
  };
}
