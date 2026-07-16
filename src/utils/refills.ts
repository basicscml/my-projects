import { Routine } from '../types';
import { daysBetween } from './dates';

export type RefillStatus = {
  routine: Routine;
  itemName: string;
  /** Days of supply left; negative means overdue. */
  daysLeft: number;
  isLow: boolean;
};

/** Refill status for one routine, or null if it has no restock cycle. */
export function refillStatus(routine: Routine, todayKey: string): RefillStatus | null {
  const r = routine.restock;
  if (!r) return null;
  const used = daysBetween(r.lastFilledKey, todayKey);
  const daysLeft = r.daysPerRefill - used;
  return {
    routine,
    itemName: r.itemName,
    daysLeft,
    isLow: daysLeft <= r.leadDays,
  };
}

/** Routines whose supply is running low, soonest first. */
export function dueRefills(routines: Routine[], todayKey: string): RefillStatus[] {
  return routines
    .map((r) => refillStatus(r, todayKey))
    .filter((s): s is RefillStatus => s != null && s.isLow)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
