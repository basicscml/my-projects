import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StoresScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { stores, checkNearby } = useShopping();
  const [checking, setChecking] = useState(false);

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
