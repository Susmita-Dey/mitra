/** Device power state for future low-power companion behaviors. */
export interface Battery {
  getLevel(): Promise<number | null>;
  isCharging(): Promise<boolean | null>;
}
