import type { Animation } from "@/types";
import "./StateDebug.css";

export interface StateDebugProps {
  animation: Animation;
}

/** Temporary dev readout — removed once animations are visible on the body. */
export function StateDebug({ animation }: StateDebugProps) {
  return <span className="state-debug">{animation}</span>;
}
