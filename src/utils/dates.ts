export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Stable per-day key in local time, e.g. "2026-07-15". */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayWeekday(d: Date = new Date()): number {
  return d.getDay();
}

/** "07:30" -> "7:30 AM" for display. */
export function formatTime(time: string | null): string {
  if (!time) return 'No reminder';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${suffix}`;
}

/** Human summary of repeat days: "Every day", "Weekdays", "Mon, Wed, Fri". */
export function formatDays(days: number[]): string {
  if (days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  const isWeekdays =
    sorted.length === 5 && sorted.every((d) => d >= 1 && d <= 5);
  if (isWeekdays) return 'Weekdays';
  const isWeekend =
    sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekend) return 'Weekends';
  return sorted.map((d) => WEEKDAYS[d]).join(', ');
}
