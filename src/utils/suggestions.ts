import { Receipt } from '../types';

export type RestockSuggestion = {
  name: string;
  timesBought: number;
  lastDateKey: string;
  avgPrice: number;
};

/**
 * Build restock suggestions from receipt history: items bought at least twice,
 * ranked by how often. Items already on the list (by name) are excluded.
 */
export function restockSuggestions(
  receipts: Receipt[],
  excludeNames: string[] = [],
  limit = 8
): RestockSuggestion[] {
  const exclude = new Set(excludeNames.map((n) => n.toLowerCase().trim()));
  const agg = new Map<
    string,
    { name: string; count: number; last: string; priceSum: number }
  >();

  for (const r of receipts) {
    for (const item of r.items) {
      const key = item.name.toLowerCase().trim();
      if (!key) continue;
      const prev = agg.get(key);
      if (prev) {
        prev.count += 1;
        prev.priceSum += item.price;
        if (r.dateKey > prev.last) prev.last = r.dateKey;
      } else {
        agg.set(key, {
          name: item.name,
          count: 1,
          last: r.dateKey,
          priceSum: item.price,
        });
      }
    }
  }

  return Array.from(agg.values())
    .filter((v) => v.count >= 2 && !exclude.has(v.name.toLowerCase().trim()))
    .sort((a, b) => b.count - a.count || (a.last < b.last ? 1 : -1))
    .slice(0, limit)
    .map((v) => ({
      name: v.name,
      timesBought: v.count,
      lastDateKey: v.last,
      avgPrice: v.priceSum / v.count,
    }));
}

export type StoreSpend = {
  storeId: string | null;
  storeName: string;
  total: number;
  count: number;
};

/** Total spend grouped by store, highest first. */
export function spendByStore(receipts: Receipt[]): StoreSpend[] {
  const agg = new Map<string, StoreSpend>();
  for (const r of receipts) {
    const key = r.storeId ?? `name:${r.storeName.toLowerCase()}`;
    const prev = agg.get(key);
    if (prev) {
      prev.total += r.total;
      prev.count += 1;
    } else {
      agg.set(key, {
        storeId: r.storeId,
        storeName: r.storeName,
        total: r.total,
        count: 1,
      });
    }
  }
  return Array.from(agg.values()).sort((a, b) => b.total - a.total);
}
