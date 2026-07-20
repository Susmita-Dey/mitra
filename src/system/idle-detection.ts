/** Tracks how long the user has been away from input. Wired in Phase 3. */
export interface IdleDetection {
  getIdleDurationMs(): Promise<number>;
  isUserIdle(thresholdMs: number): Promise<boolean>;
}
