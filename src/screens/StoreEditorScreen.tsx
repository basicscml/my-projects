import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, routineColors } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { Coord, Store } from '../types';
import { uid } from '../utils/id';
import { getCurrentCoord } from '../utils/location';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'StoreEditor'>;

const EMOJIS = ['🛒', '🥕', '🍎', '🥖', '🧀', '🐟', '💊', '🏪', '🍷', '🌮'];
const RADII = [100, 150, 250, 500];

export function StoreEditorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { getStore, upsertStore, deleteStore } = useShopping();

  const existing = route.params?.storeId ? getStore(route.params.storeId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🛒');
  const [color, setColor] = useState(existing?.color ?? routineColors[1]);
  const [location, setLocation] = useState<Coord | null>(existing?.location ?? null);
  const [radius, setRadius] = useState(existing?.radius ?? 150);
  const [geofenceEnabled, setGeofenceEnabled] = useState(existing?.geofenceEnabled ?? false);
  const [remindList, setRemindList] = useState(existing?.remindList ?? true);
  const [suggestRestock, setSuggestRestock] = useState(existing?.suggestRestock ?? true);
  const [locating, setLocating] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit store' : 'New store' });
  }, [navigation, existing]);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const coord = await getCurrentCoord();
      if (!coord) {
        Alert.alert('Location off', 'Allow location access to pin this store.');
        return;
      }
      setLocation(coord);
    } finally {
      setLocating(false);
    }
  };

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name needed', 'Give the store a name.');
      return;
    }
    if (geofenceEnabled && !location) {
      Alert.alert('Location needed', 'Set the store location to enable its geofence.');
      return;
    }
    const store: Store = {
      id: existing?.id ?? uid(),
      name: name.trim(),
      emoji,
      color,
      location,
      radius,
      geofenceEnabled,
      remindList,
      suggestRestock,
    };
    upsertStore(store);
    navigation.goBack();
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete store', `Delete “${existing.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteStore(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const Label = ({ children }: { children: string }) => (
    <Text style={[styles.label, { color: theme.textMuted }]}>{children}</Text>
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Label>NAME</Label>
      <View style={styles.nameRow}>
        <View style={[styles.emojiPreview, { backgroundColor: color + '22' }]}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grocery Market"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
        />
      </View>

      <Label>ICON</Label>
      <View style={styles.emojiGrid}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[
              styles.emojiChip,
              {
                backgroundColor: emoji === e ? theme.primarySoft : theme.card,
                borderColor: emoji === e ? theme.primary : theme.border,
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Label>COLOR</Label>
      <View style={styles.colorRow}>
        {routineColors.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.text },
            ]}
          />
        ))}
      </View>

      <Label>LOCATION</Label>
      <Pressable
        onPress={useCurrentLocation}
        style={[styles.locBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={{ fontSize: 18 }}>📍</Text>
        <Text style={[styles.locText, { color: theme.text }]}>
          {locating
            ? 'Getting location…'
            : location
            ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            : 'Use my current location'}
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Stand at (or near) the store and tap to pin it. You can update it anytime.
      </Text>

      <View style={styles.switchRow}>
        <Label>GEOFENCE ALERTS</Label>
        <Switch
          value={geofenceEnabled}
          onValueChange={setGeofenceEnabled}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>

      {geofenceEnabled && (
        <>
          <Label>TRIGGER RADIUS</Label>
          <View style={styles.radiusRow}>
            {RADII.map((r) => {
              const on = radius === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRadius(r)}
                  style={[
                    styles.radiusChip,
                    {
                      backgroundColor: on ? theme.primary : theme.card,
                      borderColor: on ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: on ? '#fff' : theme.text, fontWeight: '700' }}>
                    {r} m
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.optRow, { borderColor: theme.border }]}>
            <Text style={[styles.optText, { color: theme.text }]}>Remind me of my list</Text>
            <Switch
              value={remindList}
              onValueChange={setRemindList}
              trackColor={{ true: theme.accent, false: theme.border }}
            />
          </View>
          <View style={[styles.optRow, { borderColor: theme.border }]}>
            <Text style={[styles.optText, { color: theme.text }]}>Suggest restock picks</Text>
            <Switch
              value={suggestRestock}
              onValueChange={setSuggestRestock}
              trackColor={{ true: theme.accent, false: theme.border }}
            />
          </View>
        </>
      )}

      <Pressable onPress={onSave} style={[styles.save, { backgroundColor: theme.primary }]}>
        <Text style={styles.saveText}>Save store</Text>
      </Pressable>
      {existing && (
        <Pressable onPress={onDelete} style={styles.delete}>
          <Text style={[styles.deleteText, { color: theme.danger }]}>Delete store</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginTop: 22, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiPreview: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', gap: 14 },
  colorDot: { width: 38, height: 38, borderRadius: 19 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  locText: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusRow: { flexDirection: 'row', gap: 8 },
  radiusChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  optText: { fontSize: 15, fontWeight: '600' },
  save: { marginTop: 30, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  delete: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  deleteText: { fontWeight: '700', fontSize: 15 },
});
