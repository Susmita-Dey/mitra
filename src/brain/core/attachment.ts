import type { CompanionMemory } from "../memory";

export type AttachmentLevel = "New Friend" | "Comfortable" | "Trusted Companion" | "Best Buddy";

export function getAttachmentLevel(memory: CompanionMemory): AttachmentLevel {
  const daysSinceBoot = (Date.now() - memory.bootTime) / (1000 * 60 * 60 * 24);
  const totalAcks = memory.habitTracker.lifetimeAcknowledged;
  const totalInteractions = memory.interactionCount;

  // Composite score based on time and positive interactions
  const score = (daysSinceBoot * 2) + totalAcks + (totalInteractions * 0.5);

  if (score > 100) return "Best Buddy";
  if (score > 40) return "Trusted Companion";
  if (score > 10) return "Comfortable";
  return "New Friend";
}

export function getAttachmentModifier(level: AttachmentLevel): number {
  switch (level) {
    case "Best Buddy": return 0.2; // Extra energy/playfulness
    case "Trusted Companion": return 0.1;
    case "Comfortable": return 0;
    case "New Friend": return -0.1; // Slightly shy/reserved
  }
}
