import { ReceiptItem } from '../types';
import { uid } from './id';
import { parsePrice } from './money';
import { parseSize } from './units';

export type ParsedReceipt = {
  storeName: string | null;
  dateKey: string | null;
  total: number | null;
  items: ReceiptItem[];
};

// Lines that are structural, not products.
const SKIP_LINE =
  /\b(sub\s*total|subtotal|total|tax|vat|balance|change|cash|credit|debit|visa|mastercard|amex|tender|amount|due|savings|coupon|discount|loyalty|member|thank|receipt|order|invoice|store\s*#|reg\s*#|cashier|qty|item\s*count|# items)\b/i;

const DATE_PATTERNS: RegExp[] = [
  /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/, // 2026-07-15
  /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/, // 07/15/2026 or 15.07.26
];

const PRICE_AT_END = /(-?\$?\s*\d{1,4}(?:[.,]\d{2}))\s*-?\s*$/;
const QTY_PREFIX = /^(\d{1,3})\s*(?:x|@|ea|\*)?\s+/i;

/**
 * Best-effort parse of raw receipt text (from a photo's OCR text, a PDF text
 * layer, or pasted text) into a structured receipt. Designed to degrade
 * gracefully: whatever it can't read, the user fixes on the review screen.
 */
export function parseReceipt(raw: string): ParsedReceipt {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const storeName = detectStore(lines);
  const dateKey = detectDate(lines);
  const total = detectTotal(lines);
  const items = detectItems(lines);

  return { storeName, dateKey, total, items };
}

function detectStore(lines: string[]): string | null {
  // The store name is usually one of the first non-numeric header lines.
  for (const line of lines.slice(0, 4)) {
    const hasLetters = /[a-z]/i.test(line);
    const looksLikeAddress = /\d{3,}.*\b(st|street|ave|rd|road|blvd)\b/i.test(
      line
    );
    if (hasLetters && !PRICE_AT_END.test(line) && !looksLikeAddress) {
      return titleCase(line);
    }
  }
  return null;
}

function detectDate(lines: string[]): string | null {
  for (const line of lines) {
    for (const re of DATE_PATTERNS) {
      const m = line.match(re);
      if (!m) continue;
      const key = normalizeDate(m);
      if (key) return key;
    }
  }
  return null;
}

function normalizeDate(m: RegExpMatchArray): string | null {
  let y: number, mo: number, d: number;
  if (m[1].length === 4) {
    y = +m[1];
    mo = +m[2];
    d = +m[3];
  } else {
    // Assume M/D/Y (US receipts). Ambiguous but the user can correct it.
    mo = +m[1];
    d = +m[2];
    y = +m[3];
    if (y < 100) y += 2000;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function detectTotal(lines: string[]): number | null {
  // Prefer a line that says "total" but not "subtotal".
  let subtotalOnly: number | null = null;
  for (const line of lines) {
    if (!/\btotal\b/i.test(line)) continue;
    const m = line.match(PRICE_AT_END);
    if (!m) continue;
    const value = parsePrice(m[1]);
    if (value == null) continue;
    if (/\bsub\s*total\b/i.test(line)) {
      subtotalOnly = value;
    } else {
      return value;
    }
  }
  return subtotalOnly;
}

function detectItems(lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  for (const line of lines) {
    if (SKIP_LINE.test(line)) continue;
    const priceMatch = line.match(PRICE_AT_END);
    if (!priceMatch) continue;
    const price = parsePrice(priceMatch[1]);
    if (price == null) continue;

    let name = line.slice(0, priceMatch.index).trim();
    // Strip trailing dot leaders / codes.
    name = name.replace(/[.\s]{2,}$/, '').replace(/\s{2,}/g, ' ').trim();

    let qty = 1;
    const qtyMatch = name.match(QTY_PREFIX);
    if (qtyMatch) {
      qty = Math.max(1, parseInt(qtyMatch[1], 10));
      name = name.slice(qtyMatch[0].length).trim();
    }
    if (name.length < 2 || !/[a-z]/i.test(name)) continue;

    const size = parseSize(name);
    items.push({
      id: uid(),
      name: titleCase(name),
      price,
      qty,
      ...(size ? { size: size.display } : {}),
    });
  }
  return items;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}
