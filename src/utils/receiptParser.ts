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

// Allow a trailing tax code letter (e.g. "3.99 F", "0.86 T") after the price.
const PRICE_AT_END = /(-?\$?\s*\d{1,4}(?:[.,]\d{2}))\s*[A-Z*]?\s*-?\s*$/;
const QTY_PREFIX = /^(\d{1,3})\s*(?:x|@|ea|\*)?\s+/i;

// Weight sold by unit price, e.g. "1.24 lb @ $0.69/lb" or "0.5 kg @ 2.99 per kg".
const WEIGHT_AT =
  /(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)\b\s*@\s*\$?\s*\d+(?:[.,]\d+)?\s*(?:\/|per)\s*(?:lb|lbs|oz|kg|g)\b/i;
// A line that begins with a weight (the second line of a two-line produce entry).
const WEIGHT_LINE_START = /^\s*\d+(?:\.\d+)?\s*(?:lb|lbs|oz|kg|g)\b/i;

/**
 * Best-effort parse of raw receipt text (from a photo's OCR text, a PDF text
 * layer, or pasted text) into a structured receipt. Designed to degrade
 * gracefully: whatever it can't read, the user fixes on the review screen.
 */
export function parseReceipt(raw: string): ParsedReceipt {
  const lines = mergeProduceLines(
    raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  );

  const storeName = detectStore(lines);
  const dateKey = detectDate(lines);
  const total = detectTotal(lines);
  const items = detectItems(lines);

  return { storeName, dateKey, total, items };
}

/**
 * Produce often prints across two lines:
 *   BANANAS
 *   1.24 lb @ $0.69/lb        0.86
 * Merge the name line with the following weight+price line so it reads as one.
 */
function mergeProduceLines(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    const next = lines[i + 1];
    const nameOnly = /[a-z]/i.test(cur) && !PRICE_AT_END.test(cur) && !SKIP_LINE.test(cur);
    if (next && nameOnly && WEIGHT_LINE_START.test(next) && PRICE_AT_END.test(next)) {
      out.push(`${cur} ${next}`);
      i++; // consume the weight line
    } else {
      out.push(cur);
    }
  }
  return out;
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

    // Weight-priced produce: capture the weight as the size, drop the "@/lb" bit.
    let sizeText: string | undefined;
    const weightMatch = name.match(WEIGHT_AT);
    if (weightMatch) {
      sizeText = `${weightMatch[1]} ${weightMatch[2].toLowerCase()}`;
      name = name.replace(WEIGHT_AT, '').replace(/\s{2,}/g, ' ').trim();
    }

    let qty = 1;
    const qtyMatch = name.match(QTY_PREFIX);
    if (qtyMatch) {
      qty = Math.max(1, parseInt(qtyMatch[1], 10));
      name = name.slice(qtyMatch[0].length).trim();
    }
    // Clean any leftover trailing "@" or unit-price fragments.
    name = name.replace(/[@/].*$/, '').replace(/\s{2,}/g, ' ').trim();
    if (name.length < 2 || !/[a-z]/i.test(name)) continue;

    if (!sizeText) {
      const parsed = parseSize(name);
      if (parsed) {
        sizeText = parsed.display;
        // Drop the size token from the name so it isn't shown twice.
        name = name.replace(parsed.raw, '').replace(/\s{2,}/g, ' ').trim();
      }
    }
    if (name.length < 2 || !/[a-z]/i.test(name)) continue;

    items.push({
      id: uid(),
      name: titleCase(name),
      price,
      qty,
      ...(sizeText ? { size: sizeText } : {}),
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
