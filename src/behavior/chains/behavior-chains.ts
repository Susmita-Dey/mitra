import type { Emotion } from "@/types";
import type { ProceduralAnimationState } from "@/brain/core/types";

export interface ChainStep {
  durationMs?: number;
  animationOverrides?: Partial<ProceduralAnimationState>;
  speechBubble?: string;
  emotion?: Emotion;
  sound?: string;
}

export type BehaviorChain = ChainStep[];

function randomVariant(chains: BehaviorChain[]): BehaviorChain {
  return chains[Math.floor(Math.random() * chains.length)];
}

const WATER_CHAINS: BehaviorChain[] = [
  // Variant A: Look around -> Sip -> Bubble
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "twitch" }, emotion: "curious" },
    { durationMs: 1500, animationOverrides: { mouth: "open", props: ["mug"] }, emotion: "curious" },
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring", sound: "drink" }
  ],
  // Variant B: Tail wag -> Wave -> Bubble
  [
    { durationMs: 1500, animationOverrides: { tail: "wag", eyes: "wide" }, emotion: "curious" },
    { durationMs: 1500, animationOverrides: { posture: "stand", bodyMotion: "bounce" }, emotion: "caring" },
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring", sound: "drink" }
  ],
  // Variant C: Stretch -> Smile -> Bubble
  [
    { durationMs: 2000, animationOverrides: { posture: "stretch", eyes: "closed" }, emotion: "curious" },
    { durationMs: 1000, animationOverrides: { mouth: "smile", eyes: "happy-closed" }, emotion: "caring" },
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring", sound: "drink" }
  ]
];

const STRETCH_CHAINS: BehaviorChain[] = [
  // Variant A: Shoulder stretch -> Body stretch -> Bubble
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "bounce", ears: "twitch" }, emotion: "happy" },
    { durationMs: 2500, animationOverrides: { posture: "stretch", eyes: "closed" }, emotion: "energetic" },
    { durationMs: 0, animationOverrides: { posture: "stretch", eyes: "closed" }, speechBubble: "I'm stretching... want to join me? 🤍", emotion: "energetic" }
  ],
  // Variant B: Paws -> Happy face -> Bubble
  [
    { durationMs: 1500, animationOverrides: { posture: "sit", bodyMotion: "look-around" }, emotion: "happy" },
    { durationMs: 1500, animationOverrides: { mouth: "smile", eyes: "sparkle" }, emotion: "energetic" },
    { durationMs: 0, animationOverrides: { posture: "stretch", eyes: "closed" }, speechBubble: "I'm stretching... want to join me? 🤍", emotion: "energetic" }
  ]
];

const EYES_CHAINS: BehaviorChain[] = [
  // Variant A: Slow blink -> Eye rub -> Sleepy face
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "twitch" }, emotion: "calm" },
    { durationMs: 1000, animationOverrides: { eyes: "closed" }, emotion: "calm" },
    { durationMs: 1000, animationOverrides: { eyes: "closed" }, emotion: "calm" }, // Another blink
    { durationMs: 1500, animationOverrides: { eyes: "squint", ears: "down" }, emotion: "caring" }, // Rub eyes
    { durationMs: 0, animationOverrides: { eyes: "squint" }, speechBubble: "Our eyes deserve a tiny break 👀", emotion: "caring" }
  ],
  // Variant B: Look away -> Blink -> Bubble
  [
    { durationMs: 2000, animationOverrides: { bodyMotion: "look-around", eyes: "squint" }, emotion: "calm" },
    { durationMs: 1500, animationOverrides: { eyes: "closed", mouth: "open" }, emotion: "caring" },
    { durationMs: 0, animationOverrides: { eyes: "squint" }, speechBubble: "Our eyes deserve a tiny break 👀", emotion: "caring" }
  ]
];

import type { TimeOfDay } from "@/brain/core/types";
import { PropManager } from "@/behavior/prop-manager";

// ... existing code ...

function getFoodChain(reminderType: string, timeOfDay: TimeOfDay): BehaviorChain {
  const propId = PropManager.getFoodProp(reminderType, timeOfDay);
  const bubbleText = reminderType === "reminder:lunch" ? "Lunch break? 🍜" : 
                     reminderType === "reminder:dinner" ? "Dinner time? 🍲" :
                     reminderType === "reminder:snack" ? "Time for a little energy boost!" :
                     "Time to eat! 😋";

  return [
    // 1. Notice Prop: Look at food in paw
    { durationMs: 1500, animationOverrides: { posture: "holding-prop", props: [propId], bodyMotion: "look-around", ears: "up" }, emotion: "curious" },
    // 2. Engage User: Look directly at user, tiny smile
    { durationMs: 1000, animationOverrides: { posture: "holding-prop", props: [propId], mouth: "smile", eyes: "sparkle" }, emotion: "happy" },
    // 3. Offer & Bubble: Extend arm, wag tail, say text
    { durationMs: 2500, animationOverrides: { posture: "offering-prop", props: [propId], tail: "wag", eyes: "crescent" }, speechBubble: bubbleText, emotion: "caring" },
    // 4. Bite & Chew: Bring to mouth, puff cheeks, play chew sound
    { durationMs: 2000, animationOverrides: { posture: "eating", props: [propId], bodyMotion: "chew", mouth: "chew", eyes: "happy-closed" }, speechBubble: bubbleText, emotion: "happy", sound: "chew" },
    // 5. Satisfied Reaction: Sit happily
    { durationMs: 0, animationOverrides: { posture: "satisfied", eyes: "crescent", mouth: "smile" }, speechBubble: bubbleText, emotion: "happy" }
  ];
}

const BIO_CHAINS: BehaviorChain[] = [
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "look-around" }, emotion: "curious" },
    { durationMs: 0, animationOverrides: { posture: "sit", eyes: "squint" }, speechBubble: "🚽 Time for a bio break!", emotion: "caring" }
  ]
];

export function getReminderChain(interactionId: string, timeOfDay: TimeOfDay = "Afternoon"): BehaviorChain {
  switch (interactionId) {
    case "reminder:water": return randomVariant(WATER_CHAINS); // Could be migrated to PropManager later
    case "reminder:stretch": return randomVariant(STRETCH_CHAINS);
    case "reminder:eyes": return randomVariant(EYES_CHAINS);
    case "reminder:bio": return randomVariant(BIO_CHAINS);
    
    // Food-based generic sequence
    case "reminder:lunch":
    case "reminder:snack":
    case "reminder:dinner":
    case "reminder:breakfast":
      return getFoodChain(interactionId, timeOfDay);
      
    default: return [
      { durationMs: 0, speechBubble: "Reminder!" }
    ];
  }
}

