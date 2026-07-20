/** Time source for scheduling and time-of-day awareness. */
export interface Clock {
  now(): Date;
}
