import { Receipt } from '../types';
import { daysBetween, parseDateKey, todayWeekday, WEEKDAYS_LONG } from './dates';

export type ShoppingRhythm = {
  /** Typical days between shops (median of gaps), or null if not enough data. */
  cadenceDays: number | null;
  /** Most common weekday you shop (0=Sun…6=Sat), or null. */
  usualWeekday: number | null;
  usualWeekdayName: string | null;
  /** Days since your last shop. */
  daysSinceLast: number | null;
  /** True when you're at/near your usual cadence (a shop is due soon). */
  dueSoon: boolean;
};

/**
 * Learn your shopping rhythm from receipt dates — cadence and usual weekday —
 * so the app can gently nudge "shopping day soon, prep your list?" No manual
 * setup: it reads the dates you already have.
 */
export function shoppingRhythm(receipts: Receipt[], todayKey: string): ShoppingRhythm {
  const days = Array.from(new Set(receipts.map((r) => r.dateKey))).sort();
  if (days.length === 0) {
    return {
      cadenceDays: null,
      usualWeekday: null,
      usualWeekdayName: null,
      daysSinceLast: null,
      dueSoon: false,
    };
  }

  // Most common weekday across shop days.
  const weekdayCounts = new Array(7).fill(0);
  for (const d of days) weekdayCounts[todayWeekday(parseDateKey(d))] += 1;
  let usualWeekday = 0;
  for (let i = 1; i < 7; i++) if (weekdayCounts[i] > weekdayCounts[usualWeekday]) usualWeekday = i;

  // Median gap between consecutive shop days.
  let cadenceDays: number | null = null;
  if (days.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < days.length; i++) gaps.push(daysBetween(days[i - 1], days[i]));
    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    cadenceDays =
      gaps.length % 2 ? gaps[mid] : Math.round((gaps[mid - 1] + gaps[mid]) / 2);
  }

  const lastKey = days[days.length - 1];
  const daysSinceLast = daysBetween(lastKey, todayKey);
  const dueSoon =
    cadenceDays != null && cadenceDays > 0 && daysSinceLast >= cadenceDays - 1;

  return {
    cadenceDays,
    usualWeekday,
    usualWeekdayName: WEEKDAYS_LONG[usualWeekday] ?? null,
    daysSinceLast,
    dueSoon,
  };
}
