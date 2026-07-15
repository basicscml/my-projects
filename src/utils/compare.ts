import { ProductHealth, Receipt } from '../types';
import { parseSize, unitPrice, UnitPrice } from './units';
import { buildPantry, PantryEntry } from './pantry';

export type PriceObservation = {
  store: string;
  storeId: string | null;
  dateKey: string;
  linePrice: number;
  qty: number;
  sizeText: string | null;
  unit: UnitPrice | null; // null when we can't derive a comparable unit
};

export type ProductComparison = {
  name: string;
  observations: PriceObservation[];
  stores: string[];
  /** Cheapest and priciest comparable unit prices (same base unit). */
  best: { obs: PriceObservation; unit: UnitPrice } | null;
  worst: { obs: PriceObservation; unit: UnitPrice } | null;
  /** Fractional saving between worst and best comparable unit price (0..1). */
  savings: number;
  /** Rebuy cadence, reused from the pantry engine. */
  interval: PantryEntry | null;
  health: { score: number; grade: string } | null;
};

/** Verdict weighing health against cost, in plain language. */
export function valueVerdict(c: ProductComparison): string {
  const cheapWin = c.savings >= 0.1 && c.best;
  const h = c.health;
  if (h && h.score >= 70 && cheapWin) return 'Great value — healthy and cheaper elsewhere.';
  if (h && h.score >= 70) return 'Healthy pick.';
  if (h && h.score < 50 && cheapWin) return 'Cheaper elsewhere — but check the ingredients.';
  if (h && h.score < 50) return 'Low health score — consider a cleaner alternative.';
  if (cheapWin) return 'Better value at another store.';
  return 'Prices are close across stores.';
}

export function buildComparisons(
  receipts: Receipt[],
  health: ProductHealth,
  todayKey: string
): ProductComparison[] {
  const pantry = buildPantry(receipts, todayKey);
  const pantryByName = new Map(pantry.map((p) => [p.name.toLowerCase(), p]));

  const map = new Map<string, PriceObservation[]>();
  const names = new Map<string, string>(); // key -> display name (first seen)
  for (const r of receipts) {
    for (const item of r.items) {
      const key = item.name.toLowerCase().trim();
      if (!key) continue;
      if (!names.has(key)) names.set(key, item.name);
      const size = parseSize(item.size ?? '') ?? parseSize(item.name);
      const obs: PriceObservation = {
        store: r.storeName,
        storeId: r.storeId,
        dateKey: r.dateKey,
        linePrice: item.price,
        qty: item.qty,
        sizeText: item.size ?? size?.display ?? null,
        unit: unitPrice(item.price, item.qty, size),
      };
      const arr = map.get(key) ?? [];
      arr.push(obs);
      map.set(key, arr);
    }
  }

  const out: ProductComparison[] = [];
  for (const [key, observations] of map) {
    const name = names.get(key) ?? key;
    const stores = Array.from(new Set(observations.map((o) => o.store)));

    // Compare only observations sharing the most common base unit.
    const byUnit = new Map<string, { obs: PriceObservation; unit: UnitPrice }[]>();
    for (const o of observations) {
      if (!o.unit) continue;
      const arr = byUnit.get(o.unit.baseUnit) ?? [];
      arr.push({ obs: o, unit: o.unit });
      byUnit.set(o.unit.baseUnit, arr);
    }
    let comparable: { obs: PriceObservation; unit: UnitPrice }[] = [];
    for (const arr of byUnit.values()) if (arr.length > comparable.length) comparable = arr;

    let best: ProductComparison['best'] = null;
    let worst: ProductComparison['worst'] = null;
    let savings = 0;
    if (comparable.length > 0) {
      best = comparable.reduce((a, b) => (b.unit.value < a.unit.value ? b : a));
      worst = comparable.reduce((a, b) => (b.unit.value > a.unit.value ? b : a));
      if (worst.unit.value > 0) savings = 1 - best.unit.value / worst.unit.value;
    }

    const hp = health[key];
    out.push({
      name,
      observations: observations.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
      stores,
      best,
      worst,
      savings,
      interval: pantryByName.get(key) ?? null,
      health: hp ? { score: hp.score, grade: hp.grade } : null,
    });
  }

  // Most interesting first: real cross-store savings, then multi-store, then rest.
  return out.sort((a, b) => b.savings - a.savings || b.stores.length - a.stores.length);
}
