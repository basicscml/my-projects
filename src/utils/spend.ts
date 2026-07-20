import { Receipt } from '../types';
import { daysBetween } from './dates';

export type SpendMirror = {
  thisWeek: number;
  /** Average spend per prior week that had any receipts. */
  weeklyAvg: number;
  /** (thisWeek - weeklyAvg) / weeklyAvg, or null with no baseline yet. */
  deltaPct: number | null;
  weeksTracked: number;
};

/**
 * A calm "this week vs your usual" spend readout — a mirror, not a cop.
 * Buckets receipts into 7-day windows counting back from today; the current
 * window is "this week", earlier non-empty windows form the baseline average.
 */
export function spendMirror(receipts: Receipt[], todayKey: string): SpendMirror {
  let thisWeek = 0;
  const buckets = new Map<number, number>();

  for (const r of receipts) {
    const age = daysBetween(r.dateKey, todayKey); // days ago (>= 0)
    if (age < 0) continue;
    if (age <= 6) thisWeek += r.total;
    const week = Math.floor(age / 7);
    buckets.set(week, (buckets.get(week) ?? 0) + r.total);
  }

  const priorWeeks = Array.from(buckets.entries())
    .filter(([week]) => week > 0)
    .map(([, total]) => total);
  const weeklyAvg = priorWeeks.length
    ? priorWeeks.reduce((a, b) => a + b, 0) / priorWeeks.length
    : 0;
  const deltaPct = weeklyAvg > 0 ? (thisWeek - weeklyAvg) / weeklyAvg : null;

  return { thisWeek, weeklyAvg, deltaPct, weeksTracked: priorWeeks.length };
}
