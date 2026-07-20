let counter = 0;

/**
 * Lightweight unique id. Avoids extra deps; unique enough for local records
 * created on a single device (time + monotonic counter + entropy).
 */
export function uid(): string {
  counter = (counter + 1) % 1_000_000;
  const t = Date.now().toString(36);
  const c = counter.toString(36);
  const r = Math.floor(Math.random() * 1_000_000).toString(36);
  return `${t}-${c}-${r}`;
}
