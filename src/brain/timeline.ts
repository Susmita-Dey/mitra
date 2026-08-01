export type TimelineEventType = 
  | "lifecycle:boot"
  | "lifecycle:sleep"
  | "lifecycle:wake"
  | "reminder:scheduled"
  | "reminder:triggered"
  | "reminder:acknowledged"
  | "reminder:snoozed"
  | "reminder:ignored"
  | "reminder:completed"
  | "emotion:pushed"
  | "behavior:started"
  | "interaction"
  | "celebration"
  | "reminder:deferred"
  | "reminder:summary";

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: TimelineEventType;
  description: string;
  metadata?: any;
}

export interface TimelineEngine {
  push(events: TimelineEvent[], type: TimelineEventType, description: string, metadata?: any): TimelineEvent[];
}

export function createTimelineEngine(maxEvents = 100): TimelineEngine {
  return {
    push(events: TimelineEvent[], type: TimelineEventType, description: string, metadata?: any): TimelineEvent[] {
      const newEvent: TimelineEvent = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type,
        description,
        metadata
      };
      
      // Debug logs removed to keep console clean for developers.
      // If needed, an event-based log stream should be used instead.
      
      const newEvents = [...events, newEvent];
      if (newEvents.length > maxEvents) {
        newEvents.shift();
      }
      return newEvents;
    }
  };
}
