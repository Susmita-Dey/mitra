import type { Emotion } from "@/types";
import type { ProceduralAnimationState } from "@/brain/core/types";

export interface ChainStep {
  durationMs?: number;
  animationOverrides?: Partial<ProceduralAnimationState>;
  speechBubble?: string;
  emotion?: Emotion;
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
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring" }
  ],
  // Variant B: Tail wag -> Wave -> Bubble
  [
    { durationMs: 1500, animationOverrides: { tail: "wag", eyes: "wide" }, emotion: "curious" },
    { durationMs: 1500, animationOverrides: { posture: "stand", bodyMotion: "bounce" }, emotion: "caring" },
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring" }
  ],
  // Variant C: Stretch -> Smile -> Bubble
  [
    { durationMs: 2000, animationOverrides: { posture: "stretch", eyes: "closed" }, emotion: "curious" },
    { durationMs: 1000, animationOverrides: { mouth: "smile", eyes: "happy-closed" }, emotion: "caring" },
    { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: "Let's grab some water together? 💧", emotion: "caring" }
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

const LUNCH_CHAINS: BehaviorChain[] = [
  // Variant A: Looks at clock -> Looks at user -> Waves
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "up" }, emotion: "excited" },
    { durationMs: 1500, animationOverrides: { eyes: "wide", tail: "wag" }, emotion: "excited" },
    { durationMs: 1500, animationOverrides: { posture: "stand", bodyMotion: "bounce" }, emotion: "excited" },
    { durationMs: 0, animationOverrides: { posture: "sit", props: ["food"], eyes: "squint" }, speechBubble: "Lunch time! 🍜", emotion: "excited" }
  ],
  // Variant B: Excited bounce -> Smile
  [
    { durationMs: 2000, animationOverrides: { posture: "stand", bodyMotion: "bounce", tail: "wag" }, emotion: "excited" },
    { durationMs: 1000, animationOverrides: { mouth: "smile", eyes: "sparkle" }, emotion: "excited" },
    { durationMs: 0, animationOverrides: { posture: "sit", props: ["food"], eyes: "squint" }, speechBubble: "Lunch time! 🍜", emotion: "excited" }
  ]
];

const SNACK_CHAINS: BehaviorChain[] = [
  [
    { durationMs: 1500, animationOverrides: { ears: "twitch", eyes: "wide" }, emotion: "curious" },
    { durationMs: 1500, animationOverrides: { mouth: "smile", tail: "wag" }, emotion: "excited" },
    { durationMs: 0, animationOverrides: { posture: "sit", props: ["food"], eyes: "squint" }, speechBubble: "🥨 Snack break!", emotion: "happy" }
  ]
];

const DINNER_CHAINS: BehaviorChain[] = [
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "bounce" }, emotion: "excited" },
    { durationMs: 0, animationOverrides: { posture: "sit", props: ["food"], eyes: "squint" }, speechBubble: "🍲 Dinner time!", emotion: "excited" }
  ]
];

const BIO_CHAINS: BehaviorChain[] = [
  [
    { durationMs: 1500, animationOverrides: { bodyMotion: "look-around" }, emotion: "curious" },
    { durationMs: 0, animationOverrides: { posture: "sit", eyes: "squint" }, speechBubble: "🚽 Time for a bio break!", emotion: "caring" }
  ]
];

export function getReminderChain(interactionId: string): BehaviorChain {
  switch (interactionId) {
    case "reminder:water": return randomVariant(WATER_CHAINS);
    case "reminder:stretch": return randomVariant(STRETCH_CHAINS);
    case "reminder:eyes": return randomVariant(EYES_CHAINS);
    case "reminder:lunch": return randomVariant(LUNCH_CHAINS);
    case "reminder:snack": return randomVariant(SNACK_CHAINS);
    case "reminder:dinner": return randomVariant(DINNER_CHAINS);
    case "reminder:bio": return randomVariant(BIO_CHAINS);
    default: return [
      { durationMs: 0, speechBubble: "Reminder!" }
    ];
  }
}
