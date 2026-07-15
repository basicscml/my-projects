import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Coord, Store } from '../types';
import { distanceMeters } from './geo';
import { ensurePermissions as ensureNotifPermissions } from './notifications';

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Location.requestForegroundPermissionsAsync();
  return req.status === 'granted';
}

export async function getCurrentCoord(): Promise<Coord | null> {
  const ok = await ensureLocationPermission();
  if (!ok) return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export type NearbyHit = {
  store: Store;
  distance: number;
};

/**
 * Foreground check: which geofenced stores is the user currently inside?
 * (Expo Go can't run background geofencing; a dev build can add
 * Location.startGeofencingAsync later — see README roadmap.)
 */
export function nearbyStores(coord: Coord, stores: Store[]): NearbyHit[] {
  return stores
    .filter((s) => s.geofenceEnabled && s.location)
    .map((s) => ({ store: s, distance: distanceMeters(coord, s.location!) }))
    .filter((h) => h.distance <= h.store.radius)
    .sort((a, b) => a.distance - b.distance);
}

/** Fire a local notification when the user arrives at a store. */
export async function notifyArrival(
  store: Store,
  listCount: number
): Promise<void> {
  const granted = await ensureNotifPermissions();
  if (!granted) return;
  const parts: string[] = [];
  if (store.remindList && listCount > 0) {
    parts.push(`${listCount} item${listCount === 1 ? '' : 's'} on your list`);
  }
  if (store.suggestRestock) parts.push('tap to see restock picks');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${store.emoji} You're at ${store.name}`,
      body: parts.length ? parts.join(' · ') : 'Open your shopping list.',
      ...(Platform.OS === 'android' ? { channelId: 'routines' } : {}),
    },
    trigger: null, // immediate
  });
}
