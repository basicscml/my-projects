import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useRoutines } from '../store/RoutinesContext';
import { useShopping } from '../store/ShoppingContext';
import { ProgressRing } from '../components/ProgressRing';
import { RootStackParamList } from '../navigation/types';
import {
  WEEKDAYS_LONG,
  formatTime,
  todayWeekday,
  dateKey,
} from '../utils/dates';
import { shoppingRhythm } from '../utils/shoppingDays';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TodayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { ready, routinesForDay, completedSteps } = useRoutines();
  const { activeCount, checkNearby, receipts } = useShopping();
  const rhythm = useMemo(() => shoppingRhythm(receipts, dateKey()), [receipts]);

  const weekday = todayWeekday();
  const today = routinesForDay(weekday).sort((a, b) =>
    (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
  );

  const { doneCount, totalCount } = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const r of today) {
      total += r.steps.length;
      done += completedSteps(r.id).filter((id) =>
        r.steps.some((s) => s.id === id)
      ).length;
    }
    return { doneCount: done, totalCount: total };
  }, [today, completedSteps]);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 18
      ? 'Good afternoon'
      : 'Good evening';

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <Text style={[styles.greeting, { color: theme.textMuted }]}>
        {greeting}
      </Text>
      <Text style={[styles.title, { color: theme.text }]}>
        {WEEKDAYS_LONG[weekday]}
      </Text>

      {totalCount > 0 && (
        <View
          style={[
            styles.summary,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <ProgressRing
            progress={totalCount ? doneCount / totalCount : 0}
            color={theme.accent}
            size={58}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryBig, { color: theme.text }]}>
              {doneCount} of {totalCount} steps done
            </Text>
            <Text style={[styles.summarySub, { color: theme.textMuted }]}>
              {doneCount === totalCount
                ? 'All done today — nice work. 🎉'
                : 'One small step is enough to start.'}
            </Text>
          </View>
        </View>
      )}

      {/* Shopping at a glance */}
      <View
        style={[
          styles.shopCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Pressable
          style={styles.shopMain}
          onPress={() => navigation.navigate('Tabs', { screen: 'List' } as never)}
        >
          <Text style={styles.shopEmoji}>🛒</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Shopping list
            </Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>
              {activeCount === 0
                ? 'Nothing to buy right now'
                : `${activeCount} item${activeCount === 1 ? '' : 's'} to buy`}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => checkNearby()}
          style={[styles.nearbyBtn, { borderColor: theme.primary }]}
        >
          <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
            📍 Nearby
          </Text>
        </Pressable>
      </View>

      {/* Learned shopping rhythm */}
      {rhythm.cadenceDays != null && (
        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'List' } as never)}
          style={[
            styles.rhythmCard,
            {
              backgroundColor: rhythm.dueSoon ? theme.primarySoft : 'transparent',
              borderColor: rhythm.dueSoon ? theme.primary : theme.border,
            },
          ]}
        >
          <Text style={{ fontSize: 15 }}>🗓️</Text>
          <Text style={[styles.rhythmText, { color: rhythm.dueSoon ? theme.text : theme.textMuted }]}>
            {rhythm.dueSoon
              ? `Shopping day soon — you usually shop ${rhythm.usualWeekdayName}s, ~every ${rhythm.cadenceDays}d. Prep your list?`
              : `You usually shop ${rhythm.usualWeekdayName}s · ~every ${rhythm.cadenceDays} days`}
          </Text>
        </Pressable>
      )}

      {/* Routines */}
      {totalCount > 0 || (ready && today.length > 0) ? (
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          TODAY’S ROUTINES
        </Text>
      ) : null}

      {!ready ? null : today.length === 0 ? (
        <EmptyToday />
      ) : (
        today.map((r) => {
          const done = completedSteps(r.id).filter((id) =>
            r.steps.some((s) => s.id === id)
          ).length;
          const total = r.steps.length;
          const complete = total > 0 && done === total;
          return (
            <Pressable
              key={r.id}
              onPress={() =>
                navigation.navigate('RoutineRunner', { routineId: r.id })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: complete ? theme.accent : theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${r.name}, ${done} of ${total} steps done`}
            >
              <View style={[styles.emojiWrap, { backgroundColor: r.color + '22' }]}>
                <Text style={styles.emoji}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {r.name}
                </Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                  {total} step{total === 1 ? '' : 's'} · {formatTime(r.time)}
                </Text>
              </View>
              <ProgressRing
                progress={total ? done / total : 0}
                color={r.color}
                size={44}
                label={complete ? '✓' : `${done}/${total}`}
              />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function EmptyToday() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Nothing scheduled today
      </Text>
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
        Add a routine and pick which days it runs — it’ll show up here.
      </Text>
      <Pressable
        onPress={() => navigation.navigate('RoutineEditor', {})}
        style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.emptyBtnText}>Create a routine</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', marginTop: 2, marginBottom: 18 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryBig: { fontSize: 17, fontWeight: '700' },
  summarySub: { fontSize: 13, marginTop: 3 },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  shopMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopEmoji: { fontSize: 26 },
  nearbyBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  rhythmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: -8,
    marginBottom: 20,
  },
  rhythmText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
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
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 19, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
