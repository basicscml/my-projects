import { Coord } from '../types';

/**
 * Places adapter (OpenStreetMap Nominatim) for finding nearby stores to add as
 * favorites. Free, no key, ODbL. Like the Open Food Facts adapter, calls happen
 * on the user's device and degrade gracefully when unreachable.
 */
export type PlaceResult = {
  name: string;
  address: string | null;
  coord: Coord;
};

const BASE = 'https://nominatim.openstreetmap.org/search';
const UA = 'Homebase/1.0 (personal food shopping app)';
const TIMEOUT_MS = 9000;

function normalize(p: any): PlaceResult | null {
  const lat = parseFloat(p?.lat);
  const lon = parseFloat(p?.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  const display: string = p.display_name ?? '';
  const name = p.name || display.split(',')[0] || 'Store';
  return {
    name: name.trim(),
    address: display || null,
    coord: { latitude: lat, longitude: lon },
  };
}

/** Search for stores by name/type, biased toward the user's location. */
export async function searchPlaces(query: string, near: Coord | null): Promise<PlaceResult[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '8',
    addressdetails: '0',
    namedetails: '1',
  });
  if (near) {
    const d = 0.15; // ~10 mile bias box
    params.set(
      'viewbox',
      `${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`
    );
    params.set('bounded', '0');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .map(normalize)
      .filter((p): p is PlaceResult => p !== null);
  } finally {
    clearTimeout(timer);
  }
}
