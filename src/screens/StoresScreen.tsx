import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, routineColors } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { searchPlaces, PlaceResult } from '../utils/places';
import { getCurrentCoord } from '../utils/location';
import { uid } from '../utils/id';
import { Store } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StoresScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { stores, checkNearby, upsertStore } = useShopping();
  const [checking, setChecking] = useState(false);

  const [findQuery, setFindQuery] = useState('');
  const [finding, setFinding] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);

  const findStores = async () => {
    const q = findQuery.trim();
    if (!q) return;
    setFinding(true);
    setFindError(null);
    setPlaces([]);
    try {
      const near = await getCurrentCoord();
      const results = await searchPlaces(q, near);
      setPlaces(results);
      if (results.length === 0) setFindError('No places found for that search.');
    } catch {
      setFindError(
        'Couldn’t reach the places service. This works on your phone’s network; the preview sandbox blocks external calls.'
      );
    } finally {
      setFinding(false);
    }
  };

  const addFavorite = (p: PlaceResult) => {
    const store: Store = {
      id: uid(),
      name: p.name,
      emoji: '🛒',
      color: routineColors[1],
      address: p.address,
      location: p.coord,
      radius: 201,
      geofenceEnabled: true,
      remindList: true,
      suggestRestock: true,
    };
    upsertStore(store);
    setPlaces((prev) => prev.filter((x) => x !== p));
    Alert.alert('Added', `${p.name} is now a favorite store with a ⅛-mile geofence.`);
  };

  const onCheckNearby = async () => {
    setChecking(true);
    try {
      const hits = await checkNearby();
      if (hits.length === 0) {
        Alert.alert(
          'Nothing nearby',
          'You’re not inside any geofenced store right now. Set a store’s location to its address and enable its geofence.'
        );
      } else {
        Alert.alert(
          'You’re here!',
          `Inside: ${hits.map((h) => h.store.name).join(', ')}. Sent you a reminder.`
        );
      }
    } catch {
      Alert.alert('Location error', 'Could not read your location.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 96 }}>
        <Text style={[styles.title, { color: theme.text }]}>Stores</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Give a store a location and geofence to get list reminders and
          restock picks when you arrive.
        </Text>

        <Pressable
          onPress={onCheckNearby}
          disabled={checking}
          style={[styles.nearby, { backgroundColor: theme.card, borderColor: theme.primary }]}
        >
          <Text style={{ fontSize: 20 }}>📍</Text>
          <Text style={[styles.nearbyText, { color: theme.text }]}>
            {checking ? 'Checking…' : 'Check what’s nearby now'}
          </Text>
        </Pressable>

        {/* Find local stores to add as favorites */}
        <Text style={[styles.section, { color: theme.textMuted }]}>FIND LOCAL STORES</Text>
        <View style={styles.findRow}>
          <TextInput
            value={findQuery}
            onChangeText={setFindQuery}
            onSubmitEditing={findStores}
            returnKeyType="search"
            placeholder="e.g. Trader Joe’s, or supermarket"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          />
          <Pressable
            onPress={findStores}
            disabled={finding || !findQuery.trim()}
            style={[styles.findBtn, { backgroundColor: findQuery.trim() ? theme.primary : theme.border }]}
          >
            <Text style={styles.findBtnText}>{finding ? '…' : 'Find'}</Text>
          </Pressable>
        </View>
        {findError && <Text style={[styles.findHint, { color: theme.textMuted }]}>{findError}</Text>}
        {places.map((p, i) => (
          <View key={i} style={[styles.placeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
              {p.address && (
                <Text style={[styles.cardSub, { color: theme.textMuted }]} numberOfLines={1}>{p.address}</Text>
              )}
            </View>
            <Pressable onPress={() => addFavorite(p)} style={[styles.addFav, { backgroundColor: theme.primary }]}>
              <Text style={styles.addFavText}>＋ Add</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.section, { color: theme.textMuted, marginTop: 24 }]}>MY STORES</Text>
        {stores.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => navigation.navigate('StoreEditor', { storeId: s.id })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.emojiWrap, { backgroundColor: s.color + '22' }]}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{s.name}</Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                {s.location
                  ? s.geofenceEnabled
                    ? `Geofence on · ${s.radius} m`
                    : 'Location set · geofence off'
                  : 'No location yet'}
              </Text>
            </View>
            {s.geofenceEnabled && s.location ? <Text style={{ fontSize: 16 }}>📡</Text> : null}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('StoreEditor', {})}
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + 20 }]}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 16 },
  nearby: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  nearbyText: { fontWeight: '700', fontSize: 15 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  findRow: { flexDirection: 'row', gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  findBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  findBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  findHint: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  addFav: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addFavText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '600', marginTop: -2 },
});
