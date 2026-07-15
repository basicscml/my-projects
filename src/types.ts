export type Step = {
  id: string;
  text: string;
};

/**
 * A repeatable routine (e.g. "Morning", "Meds", "Wind-down").
 * `days` are weekday indices 0=Sun … 6=Sat that the routine runs on.
 * `time` is "HH:MM" (24h) used for the daily reminder; null means no reminder.
 */
export type Routine = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  days: number[];
  time: string | null;
  reminderEnabled: boolean;
  steps: Step[];
  /** Scheduled OS notification ids so we can cancel/reschedule cleanly. */
  notificationIds: string[];
};

/**
 * Per-day completion record.
 * completions[dateKey][routineId] = list of completed step ids for that day.
 */
export type Completions = {
  [dateKey: string]: {
    [routineId: string]: string[];
  };
};
