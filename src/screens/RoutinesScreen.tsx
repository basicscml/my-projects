import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useRoutines } from '../store/RoutinesContext';
import { RootStackParamList } from '../navigation/types';
import { formatDays, formatTime } from '../utils/dates';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RoutinesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { routines } = useRoutines();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 96,
        }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Routines</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {routines.length} routine{routines.length === 1 ? '' : 's'}
        </Text>

        {routines.map((r) => (
          <Pressable
            key={r.id}
            onPress={() =>
              navigation.navigate('RoutineEditor', { routineId: r.id })
            }
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.emojiWrap, { backgroundColor: r.color + '22' }]}>
              <Text style={styles.emoji}>{r.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {r.name}
              </Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                {formatDays(r.days)} · {formatTime(r.time)}
              </Text>
            </View>
            {r.reminderEnabled && r.time ? (
              <Text style={styles.bell}>🔔</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('RoutineEditor', {})}
        style={[
          styles.fab,
          { backgroundColor: theme.primary, bottom: insets.bottom + 20 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add routine"
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2, marginBottom: 18 },
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
  emoji: { fontSize: 22 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },
  bell: { fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '600', marginTop: -2 },
});
