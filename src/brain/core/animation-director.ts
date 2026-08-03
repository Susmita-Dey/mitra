import { EmotionState, ProceduralAnimationState } from "./types";
import { EmotionEngine } from "./emotion-engine";
import type { ChainStep } from "@/behavior/chains/behavior-chains";
import type { Emotion } from "@/types";

export type DirectorPriority = 
  | "CriticalReminder"
  | "MeetingSummary"
  | "Interaction"
  | "Reminder"
  | "Idle";

export interface ActiveSequence {
  id: string;
  priority: DirectorPriority;
  steps: ChainStep[];
  currentStepIndex: number;
  stepStartedAt: number;
}

export interface SequenceOptions {
  id: string;
  priority: DirectorPriority;
  animationOverrides?: Partial<ProceduralAnimationState>;
  speechBubble?: string;
  durationMs?: number;
  emotion?: Emotion;
  steps?: ChainStep[];
}

export interface AnimationDirector {
  tick(
    now: number,
    emotion: EmotionState,
    emotionEngine: EmotionEngine,
    setRenderState: (anim: ProceduralAnimationState, bubble: string | null, interactionId: string | null, tempEmotion: Emotion | null) => void,
    emitSound?: (category: string) => void
  ): void;
  
  queueSequence(opts: SequenceOptions): void;
  clearSequence(id: string): void;
  cancelAnticipation(): void;
}

export function createAnimationDirector(): AnimationDirector {
  let activeSequence: ActiveSequence | null = null;
  const queue: ActiveSequence[] = [];

  const priorityWeight: Record<DirectorPriority, number> = {
    CriticalReminder: 100,
    MeetingSummary: 80,
    Interaction: 60,
    Reminder: 40,
    Idle: 0
  };

  return {
    queueSequence(opts) {
      if (activeSequence?.id === opts.id) {
        return; // Already active
      }
      
      const existingIdx = queue.findIndex(q => q.id === opts.id);
      if (existingIdx !== -1) {
        return; // Already in queue
      }

      const steps = opts.steps || [{
        durationMs: opts.durationMs,
        animationOverrides: opts.animationOverrides,
        speechBubble: opts.speechBubble,
        emotion: opts.emotion
      }];

      const seq: ActiveSequence = {
        id: opts.id,
        priority: opts.priority,
        steps,
        currentStepIndex: 0,
        stepStartedAt: 0 // Will be set when activated
      };

      if (!activeSequence || priorityWeight[seq.priority] > priorityWeight[activeSequence.priority]) {
        // Preempt current
        if (activeSequence && activeSequence.priority !== "Idle") {
           queue.push({ ...activeSequence });
        }
        activeSequence = { ...seq, stepStartedAt: Date.now() };
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
      for (let i = queue.length - 1; i >= 0; i--) {
         if (queue[i].id === id) {
            queue.splice(i, 1);
         }
      }
    },
    
    cancelAnticipation() {
      if (activeSequence?.priority === "Reminder") {
        const currentStep = activeSequence.steps[activeSequence.currentStepIndex];
        // If it doesn't have a speech bubble, it's an anticipation step.
        if (!currentStep.speechBubble) {
           activeSequence = null;
        }
      }
    },

    tick(now, emotion, emotionEngine, setRenderState, emitSound) {
      // 1. Check if active step expired
      if (activeSequence) {
        const currentStep = activeSequence.steps[activeSequence.currentStepIndex];
        if (currentStep.durationMs && now - activeSequence.stepStartedAt > currentStep.durationMs) {
          if (activeSequence.currentStepIndex < activeSequence.steps.length - 1) {
            activeSequence.currentStepIndex++;
            activeSequence.stepStartedAt = now;
            
            const nextStep = activeSequence.steps[activeSequence.currentStepIndex];
            if (nextStep.sound && emitSound) {
              emitSound(nextStep.sound);
            }
          } else {
            activeSequence = null; // chain finished
          }
        }
      }

      // 2. Promote from queue if idle
      if (!activeSequence && queue.length > 0) {
        const next = queue.shift()!;
        activeSequence = { ...next, stepStartedAt: now };
        if (activeSequence.steps[0]?.sound && emitSound) {
          emitSound(activeSequence.steps[0].sound);
        }
      }

      // 3. Derive base procedural state from emotion
      const activeStep = activeSequence ? activeSequence.steps[activeSequence.currentStepIndex] : null;
      const tempEmotion = activeStep?.emotion || null;
      
      const isInteracting = activeSequence?.priority === "Interaction";
      const derivedEmotionState = tempEmotion ? { ...emotion, mood: tempEmotion } : emotion;
      const baseAnim = emotionEngine.deriveAnimation(derivedEmotionState, isInteracting);

      // 4. Apply sequence overrides
      const finalAnim: ProceduralAnimationState = {
        ...baseAnim,
        ...(activeStep?.animationOverrides || {})
      };
      
      const bubble = activeStep?.speechBubble || null;

      // 5. Output to renderer
      setRenderState(finalAnim, bubble, activeSequence?.id || null, tempEmotion);
    }
  };
}
