import type { CharacterState } from "@/types";
import "./StateDebug.css";

export interface StateDebugProps {
  character: CharacterState;
}

/** Temporary dev readout — removed once animations are visible on the body. */
export function StateDebug({ character }: StateDebugProps) {
  return (
    <span className="state-debug">
      <div className="debug-content" style={{fontSize: '10px', marginTop: '4px'}}>
        <div>Action: {character.animation}</div>
        <div>Int: {character.interaction}</div>
      </div>
    </span>
  );
}
