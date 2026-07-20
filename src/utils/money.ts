/** Format a number as USD. Kept in one place so currency can change later. */
export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Parse a price token like "$1.99", "1,99", "3.50-" into a number, or null. */
export function parsePrice(token: string): number | null {
  const cleaned = token
    .replace(/[^0-9.,-]/g, '')
    .replace(/,(\d{2})$/, '.$1') // 1,99 -> 1.99 (EU style)
    .replace(/,/g, ''); // thousands separators
  const negative = /-\s*$/.test(token) || /^\s*-/.test(token);
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return negative ? -Math.abs(value) : value;
}
