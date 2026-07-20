export type UnitKind = 'weight' | 'volume' | 'count';
export type BaseUnit = 'oz' | 'fl oz' | 'ct';

export type ParsedSize = {
  raw: string;
  /** Amount expressed in the canonical base unit for its kind. */
  amount: number;
  kind: UnitKind;
  baseUnit: BaseUnit;
  display: string;
};

// Conversions INTO the canonical base unit.
const WEIGHT_TO_OZ: Record<string, number> = {
  oz: 1,
  ounce: 1,
  ounces: 1,
  lb: 16,
  lbs: 16,
  pound: 16,
  pounds: 16,
  g: 0.035274,
  gram: 0.035274,
  grams: 0.035274,
  kg: 35.274,
  kilogram: 35.274,
  kilograms: 35.274,
};

const VOLUME_TO_FLOZ: Record<string, number> = {
  'fl oz': 1,
  floz: 1,
  ml: 0.033814,
  l: 33.814,
  liter: 33.814,
  litre: 33.814,
  gal: 128,
  gallon: 128,
  qt: 32,
  quart: 32,
  pt: 16,
  pint: 16,
  cup: 8,
  cups: 8,
};

const COUNT_WORDS: Record<string, number> = {
  ct: 1,
  count: 1,
  ea: 1,
  each: 1,
  pk: 1,
  pack: 1,
  x: 1,
  dozen: 12,
  doz: 12,
};

// Match "1 lb", "1.5lb", "64 fl oz", "1/4 lb", "500g", "12 ct", "1 dozen".
const SIZE_RE =
  /(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)\s*(fl\s*oz|floz|ounces?|oz|lbs?|pounds?|kg|kilograms?|grams?|g|gallons?|gal|quarts?|qt|pints?|pt|cups?|cup|liters?|litres?|l|ml|dozen|doz|count|ct|each|ea|packs?|pk|x)\b/i;

function toNumber(token: string): number {
  if (token.includes('/')) {
    const [a, b] = token.split('/').map((t) => parseFloat(t.trim()));
    return b ? a / b : a;
  }
  return parseFloat(token);
}

/** Extract the first size expression from a string, or null. */
export function parseSize(text: string): ParsedSize | null {
  if (!text) return null;
  const m = text.match(SIZE_RE);
  if (!m) return null;
  const qty = toNumber(m[1]);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const unit = m[2].toLowerCase().replace(/\s+/g, ' ').trim();

  if (unit in WEIGHT_TO_OZ) {
    return { raw: m[0].trim(), amount: qty * WEIGHT_TO_OZ[unit], kind: 'weight', baseUnit: 'oz', display: `${qty} ${unit}` };
  }
  const volKey = unit === 'fl oz' || unit === 'floz' ? 'fl oz' : unit;
  if (volKey in VOLUME_TO_FLOZ) {
    return { raw: m[0].trim(), amount: qty * VOLUME_TO_FLOZ[volKey], kind: 'volume', baseUnit: 'fl oz', display: `${qty} ${unit}` };
  }
  if (unit in COUNT_WORDS) {
    return { raw: m[0].trim(), amount: qty * COUNT_WORDS[unit], kind: 'count', baseUnit: 'ct', display: `${qty} ${unit}` };
  }
  return null;
}

export type UnitPrice = {
  /** Price per base unit ($/oz, $/fl oz, or $/each). */
  value: number;
  kind: UnitKind;
  baseUnit: BaseUnit;
};

/**
 * Compute a comparable unit price. `linePrice` is the receipt line total,
 * `qty` the number of that line item, `size` the per-unit size if known.
 * With no size we fall back to price-per-each (count).
 */
export function unitPrice(linePrice: number, qty: number, size: ParsedSize | null): UnitPrice {
  const count = Math.max(1, qty);
  if (size) {
    const totalBase = size.amount * count;
    return { value: totalBase > 0 ? linePrice / totalBase : linePrice, kind: size.kind, baseUnit: size.baseUnit };
  }
  return { value: linePrice / count, kind: 'count', baseUnit: 'ct' };
}

export function formatUnitPrice(up: UnitPrice): string {
  const per = up.baseUnit === 'ct' ? 'each' : up.baseUnit;
  const cents = up.value < 1 ? `${(up.value * 100).toFixed(1)}¢` : `$${up.value.toFixed(2)}`;
  return `${cents}/${per}`;
}
