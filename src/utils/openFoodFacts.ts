/**
 * Open Food Facts adapter — the first real "source adapter" from the ingestion
 * strategy in DATA_SOURCES.md. It maps OFF's product data into one normalized
 * shape the app consumes, so adding more sources later means more adapters, not
 * more app plumbing.
 *
 * Open Food Facts is free and open (ODbL), no API key. It asks apps to send a
 * descriptive User-Agent. Network calls happen on the user's device; if the
 * lookup fails (offline, blocked, product missing) callers degrade gracefully.
 */

export type NutriScore = 'a' | 'b' | 'c' | 'd' | 'e' | null;

/** Normalized product — the shape every lookup source maps into. */
export type ProductResult = {
  source: 'openfoodfacts';
  code: string; // barcode
  name: string;
  brand: string | null;
  ingredientsText: string | null;
  /** E-number tags like "e322", "e500" (prefixes stripped). */
  additiveTags: string[];
  /** NOVA ultra-processing group 1 (unprocessed) … 4 (ultra-processed). */
  novaGroup: number | null;
  nutriScore: NutriScore;
  imageUrl: string | null;
};

const BASE = 'https://world.openfoodfacts.org';
const UA = 'Homebase/1.0 (personal food shopping app)';
const FIELDS =
  'code,product_name,brands,nova_group,nutriscore_grade,additives_tags,ingredients_text,image_front_small_url';
const TIMEOUT_MS = 9000;

async function offFetch(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalize(p: any): ProductResult | null {
  if (!p) return null;
  const code = String(p.code ?? '').trim();
  const name = (p.product_name ?? '').trim();
  if (!name && !code) return null;
  const additiveTags: string[] = Array.isArray(p.additives_tags)
    ? p.additives_tags.map((t: string) => t.replace(/^[a-z]{2}:/, '').toLowerCase())
    : [];
  const grade = (p.nutriscore_grade ?? '').toLowerCase();
  const nutriScore: NutriScore = ['a', 'b', 'c', 'd', 'e'].includes(grade)
    ? (grade as NutriScore)
    : null;
  return {
    source: 'openfoodfacts',
    code,
    name: name || `Product ${code}`,
    brand: (p.brands ?? '').split(',')[0]?.trim() || null,
    ingredientsText: (p.ingredients_text ?? '').trim() || null,
    additiveTags,
    novaGroup: typeof p.nova_group === 'number' ? p.nova_group : null,
    nutriScore,
    imageUrl: p.image_front_small_url ?? null,
  };
}

/** Look up a single product by its barcode. Returns null if not found. */
export async function fetchProductByBarcode(barcode: string): Promise<ProductResult | null> {
  const code = barcode.replace(/\D/g, '');
  if (!code) return null;
  const data = await offFetch(`${BASE}/api/v2/product/${code}.json?fields=${FIELDS}`);
  if (data.status === 0 || !data.product) return null;
  return normalize(data.product);
}

/** Search products by name; returns up to `limit` normalized results. */
export async function searchProductsByName(query: string, limit = 6): Promise<ProductResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`;
  const data = await offFetch(url);
  const products: any[] = Array.isArray(data.products) ? data.products : [];
  return products.map(normalize).filter((p): p is ProductResult => p !== null);
}

export function nutriScoreColor(grade: NutriScore): string {
  switch (grade) {
    case 'a': return '#2E7D4F';
    case 'b': return '#7BA05B';
    case 'c': return '#E0A458';
    case 'd': return '#E07B39';
    case 'e': return '#D96A6A';
    default: return '#9B97AE';
  }
}

export function novaColor(group: number | null): string {
  switch (group) {
    case 1: return '#2E7D4F';
    case 2: return '#7BA05B';
    case 3: return '#E0A458';
    case 4: return '#D96A6A';
    default: return '#9B97AE';
  }
}

export function novaLabel(group: number | null): string {
  switch (group) {
    case 1: return 'Unprocessed';
    case 2: return 'Processed culinary';
    case 3: return 'Processed';
    case 4: return 'Ultra-processed';
    default: return 'Unknown';
  }
}
