import { Receipt } from '../types';
import { daysBetween } from './dates';

export type PantryStatus = 'low' | 'soon' | 'stocked';

/**
 * A pantry entry derived entirely from receipt history — no manual inventory.
 * We learn each item's rebuy interval ("burn rate") and predict when you'll
 * run out. This is the whole trick: the pantry stocks itself from a thing you
 * already do (scanning receipts).
 */
export type PantryEntry = {
  name: string;
  timesBought: number;
  lastDateKey: string;
  daysSinceLast: number;
  /** Average days between purchases; null if only bought once. */
  avgIntervalDays: number | null;
  /** Predicted days until you run out; negative = overdue. null if unknown. */
  daysLeft: number | null;
  status: PantryStatus;
  avgPrice: number;
};

const RANK: Record<PantryStatus, number> = { low: 0, soon: 1, stocked: 2 };

export function buildPantry(receipts: Receipt[], todayKey: string): PantryEntry[] {
  type Agg = { name: string; dates: string[]; priceSum: number; count: number };
  const map = new Map<string, Agg>();

  for (const r of receipts) {
    for (const item of r.items) {
      const key = item.name.toLowerCase().trim();
      if (!key) continue;
      const e = map.get(key) ?? { name: item.name, dates: [], priceSum: 0, count: 0 };
      e.dates.push(r.dateKey);
      e.priceSum += item.price;
      e.count += 1;
      map.set(key, e);
    }
  }

  const entries: PantryEntry[] = [];
  for (const e of map.values()) {
    const days = Array.from(new Set(e.dates)).sort(); // unique purchase days, ascending
    const lastDateKey = days[days.length - 1];
    const daysSinceLast = daysBetween(lastDateKey, todayKey);

    let avgIntervalDays: number | null = null;
    if (days.length >= 2) {
      let total = 0;
      for (let i = 1; i < days.length; i++) total += daysBetween(days[i - 1], days[i]);
      avgIntervalDays = total / (days.length - 1);
    }

    let daysLeft: number | null = null;
    let status: PantryStatus = 'stocked';
    if (avgIntervalDays != null) {
      daysLeft = Math.round(avgIntervalDays - daysSinceLast);
      const soonWindow = Math.max(2, avgIntervalDays * 0.25);
      if (daysLeft <= 0) status = 'low';
      else if (daysLeft <= soonWindow) status = 'soon';
      else status = 'stocked';
    }

    entries.push({
      name: e.name,
      timesBought: e.count,
      lastDateKey,
      daysSinceLast,
      avgIntervalDays,
      daysLeft,
      status,
      avgPrice: e.priceSum / e.count,
    });
  }

  return entries.sort(
    (a, b) => RANK[a.status] - RANK[b.status] || (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
  );
}

/** Items that are out or nearly out (predicted). */
export function runningLow(entries: PantryEntry[]): PantryEntry[] {
  return entries.filter((e) => e.status === 'low' || e.status === 'soon');
}

/**
 * "Did I already buy this?" — the most recent receipt within `withinDays`
 * that contains this item, or null. Used to catch accidental re-buys.
 */
export function recentlyBought(
  receipts: Receipt[],
  name: string,
  withinDays: number,
  todayKey: string
): string | null {
  const target = name.toLowerCase().trim();
  if (!target) return null;
  let best: string | null = null;
  for (const r of receipts) {
    if (daysBetween(r.dateKey, todayKey) > withinDays) continue;
    if (r.items.some((i) => i.name.toLowerCase().trim() === target)) {
      if (!best || r.dateKey > best) best = r.dateKey;
    }
  }
  return best;
}
