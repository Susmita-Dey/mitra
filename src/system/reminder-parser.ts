export interface ParsedReminder {
  type: "medicine" | "posture" | "coffee" | "coding break" | "meetings" | "lunch" | "other";
  label: string;
  triggerType: "interval" | "time" | "countdown";
  intervalMs?: number;
  time?: string;
  countdownMs?: number;
}

export function parseReminderString(input: string): ParsedReminder | null {
  // Strip HTML/Script tags to prevent XSS or DOM injection
  let cleanInput = input.replace(/<\/?[^>]+(>|$)/g, "").trim();

  // Truncate length to maximum 120 characters to prevent buffer overflow or storage exhaustion
  if (cleanInput.length > 120) {
    cleanInput = cleanInput.slice(0, 120) + "...";
  }

  const text = cleanInput.toLowerCase();
  if (!text) return null;

  // 1. Identify Type
  let type: ParsedReminder["type"] = "other";
  let emoji = "🔔";

  if (/\b(medicine|med|pill|pills|dose|tablet|vitamin|vitamins)\b/.test(text)) {
    type = "medicine";
    emoji = "💊";
  } else if (/\b(posture|sit|back|slouch|straight)\b/.test(text)) {
    type = "posture";
    emoji = "🧘";
  } else if (/\b(coffee|tea|caffeine|drink|mug|latte|espresso|water)\b/.test(text)) {
    type = "coffee";
    emoji = "☕";
  } else if (/\b(coding break|code break|coding|work break|break|rest|relax)\b/.test(text)) {
    type = "coding break";
    emoji = "💻";
  } else if (/\b(meeting|meetings|call|standup|zoom|huddle|calendar)\b/.test(text)) {
    type = "meetings";
    emoji = "📅";
  } else if (/\b(lunch|dinner|snack|eat|food|meal|breakfast)\b/.test(text)) {
    type = "lunch";
    emoji = "🍜";
  }

  // 2. Extract clean label description
  let label = "";
  
  // Try matching "remind me to [action]" or "remind me of [action]"
  const remindMeMatch = cleanInput.match(/remind\s+me\s+(?:to|of)\s+(.+?)(?:\s+(?:at|every|in)\s+|$)/i);
  if (remindMeMatch) {
    label = remindMeMatch[1].trim();
  } else {
    // Fallback: strip command words and time expressions
    label = cleanInput
      .replace(/remind\s+me/gi, "")
      .replace(/(?:at|every|in)\s+\d+.*/gi, "")
      .trim();
  }

  // Ensure first character is capitalized
  if (label) {
    label = label.charAt(0).toUpperCase() + label.slice(1);
  } else {
    // Default fallback labels if empty
    switch (type) {
      case "medicine": label = "Take medicine"; break;
      case "posture": label = "Check posture"; break;
      case "coffee": label = "Coffee break"; break;
      case "coding break": label = "Coding break"; break;
      case "meetings": label = "Meeting"; break;
      case "lunch": label = "Lunch"; break;
      default: label = "Reminder"; break;
    }
  }

  // Append emoji if not present in the parsed text to make it visual
  if (!label.includes(emoji)) {
    label += ` ${emoji}`;
  }

  // 3. Parse Trigger Logic
  
  // A. Check for "every [value] [unit]" -> Interval
  const everyMatch = text.match(/every\s+(\d+)\s*(min|mins|minute|minutes|m|hour|hours|h|hr|hrs|second|seconds|s)/);
  if (everyMatch) {
    const value = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    let multiplier = 60 * 1000; // minutes
    if (unit.startsWith("h")) {
      multiplier = 60 * 60 * 1000; // hours
    } else if (unit.startsWith("s")) {
      multiplier = 1000; // seconds (useful for testing!)
    }
    return {
      type,
      label,
      triggerType: "interval",
      intervalMs: value * multiplier
    };
  }

  // B. Check for "in [value] [unit]" -> Countdown (One-shot)
  const inMatch = text.match(/in\s+(\d+)\s*(min|mins|minute|minutes|m|hour|hours|h|hr|hrs|second|seconds|s)/);
  if (inMatch) {
    const value = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    let multiplier = 60 * 1000; // minutes
    if (unit.startsWith("h")) {
      multiplier = 60 * 60 * 1000; // hours
    } else if (unit.startsWith("s")) {
      multiplier = 1000; // seconds (useful for testing!)
    }
    return {
      type,
      label,
      triggerType: "countdown",
      countdownMs: value * multiplier
    };
  }

  // C. Check for "at [time]" -> Clock time (Daily)
  // E.g., "at 15:30", "at 3:00 pm", "at 4pm", "at 11am", etc.
  const atMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (atMatch) {
    let hours = parseInt(atMatch[1], 10);
    const minutes = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
    const ampm = atMatch[3];

    if (ampm) {
      if (ampm === "pm" && hours < 12) {
        hours += 12;
      } else if (ampm === "am" && hours === 12) {
        hours = 0;
      }
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeStr = `${pad(hours)}:${pad(minutes)}`;

    return {
      type,
      label,
      triggerType: "time",
      time: timeStr
    };
  }

  // Default Fallback: Countdown of 30 minutes
  return {
    type,
    label,
    triggerType: "countdown",
    countdownMs: 30 * 60 * 1000
  };
}

export interface SafetyCheckResult {
  safe: boolean;
  reason: "crisis" | "negative" | "violence" | "illegal" | null;
  suggestion?: string;
}

export function checkSafety(input: string): SafetyCheckResult {
  const text = input.trim().toLowerCase();

  // 1. Crisis / Self-Harm patterns (expanded)
  const crisisRegex = /\b(kill\s+myself|suicide|self\s*harm|end\s+my\s+life|cut\s+myself|want\s+to\s+die|hang\s+myself|overdose|jump\s+off|poison\s+myself|starve\s+myself|hurt\s+myself|slashing|asphyxiation)\b/i;
  if (crisisRegex.test(text)) {
    return {
      safe: false,
      reason: "crisis",
      suggestion: "If you're going through a tough time, please know you are not alone. Please reach out to a support line (call/text 988) or a trusted friend. 🤍"
    };
  }

  // 2. Harm to Others / Violence / Weapons patterns
  const violenceRegex = /\b(kill\s+someone|hurt\s+someone|murder|assault|stab|shoot|punch|bomb|attack|threaten|destroy|kill\s+people|shoot\s+up|rob\s+bank|steal)\b/i;
  if (violenceRegex.test(text)) {
    return {
      safe: false,
      reason: "violence",
      suggestion: "Mitra encourages a safe, peaceful environment. Actions causing harm to others are prohibited. 🕊️"
    };
  }

  // 3. Illegal Activities / Hacking / Illicit Drugs patterns
  const illegalRegex = /\b(cocaine|heroin|meth|fentanyl|illegal\s+drugs|buy\s+gun|make\s+bomb|hack\s+server|ddos|malware|credit\s+card\s+fraud|pirated\s+software|identity\s+theft|smuggling|selling\s+drugs)\b/i;
  if (illegalRegex.test(text)) {
    return {
      safe: false,
      reason: "illegal",
      suggestion: "Mitra cannot help schedule or track illegal activities or illicit substances. 🛡️"
    };
  }

  // 4. Severe Negative Self-Talk patterns
  const negativeRegex = /\b(i\s+am\s+stupid|i\s+am\s+worthless|i\s+am\s+a\s+failure|i\s+am\s+ugly|i\s+am\s+useless|i\s+hate\s+myself|i\s+suck|i'm\s+a\s+loser)\b/i;
  if (negativeRegex.test(text)) {
    return {
      safe: false,
      reason: "negative",
      suggestion: "Let's focus on positive reminders today! You are capable, valuable, and doing your best. 🌟"
    };
  }

  return { safe: true, reason: null };
}

