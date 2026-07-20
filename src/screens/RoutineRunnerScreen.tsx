import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useRoutines } from '../store/RoutinesContext';
import { RootStackParamList } from '../navigation/types';
import { ProgressRing } from '../components/ProgressRing';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'RoutineRunner'>;

function formatClock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RoutineRunnerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { getRoutine, completedSteps, toggleStep, resetRoutineForToday } =
    useRoutines();

  const routine = getRoutine(route.params.routineId);
  const [showAll, setShowAll] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: routine?.name ?? 'Routine' });
  }, [navigation, routine]);

  const done = useMemo(
    () => new Set(routine ? completedSteps(routine.id) : []),
    [routine, completedSteps]
  );

  // "Just 2 minutes" starter timer — the hardest part of a task is starting.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (secondsLeft == null || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s != null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  if (!routine) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>Routine not found.</Text>
      </View>
    );
  }

  const total = routine.steps.length;
  const doneCount = routine.steps.filter((s) => done.has(s.id)).length;
  const allDone = doneCount === total;
  const current = routine.steps.find((s) => !done.has(s.id));

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 30,
      }}
    >
      <View style={styles.headerRow}>
        <View style={[styles.emojiWrap, { backgroundColor: routine.color + '22' }]}>
          <Text style={{ fontSize: 30 }}>{routine.emoji}</Text>
        </View>
        <ProgressRing
          progress={total ? doneCount / total : 0}
          color={routine.color}
          size={64}
          label={allDone ? '✓' : `${doneCount}/${total}`}
        />
      </View>

      {allDone ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={[styles.doneTitle, { color: theme.text }]}>
            Routine complete
          </Text>
          <Text style={[styles.doneText, { color: theme.textMuted }]}>
            You finished every step. That counts.
          </Text>
        </View>
      ) : (
        current && (
          <View
            style={[
              styles.focusCard,
              { backgroundColor: theme.card, borderColor: routine.color },
            ]}
          >
            <Text style={[styles.focusLabel, { color: theme.textMuted }]}>
              DO THIS NOW
            </Text>
            <Text style={[styles.focusText, { color: theme.text }]}>
              {current.text}
            </Text>
            <Pressable
              onPress={() => {
                toggleStep(routine.id, current.id);
                setSecondsLeft(null);
              }}
              style={[styles.doneBtn, { backgroundColor: routine.color }]}
              accessibilityRole="button"
              accessibilityLabel={`Mark done: ${current.text}`}
            >
              <Text style={styles.doneBtnText}>Mark done ✓</Text>
            </Pressable>

            {secondsLeft == null ? (
              <Pressable onPress={() => setSecondsLeft(120)} style={styles.twoMin}>
                <Text style={[styles.twoMinText, { color: routine.color }]}>
                  ⏱ Just 2 minutes
                </Text>
              </Pressable>
            ) : secondsLeft > 0 ? (
              <View style={styles.twoMinRun}>
                <Text style={[styles.twoMinTimer, { color: routine.color }]}>
                  {formatClock(secondsLeft)}
                </Text>
                <Text style={[styles.twoMinHint, { color: theme.textMuted }]}>
                  Just start — you can stop when it hits zero.
                </Text>
                <Pressable onPress={() => setSecondsLeft(null)} hitSlop={8}>
                  <Text style={[styles.twoMinStop, { color: theme.textMuted }]}>Stop</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.twoMinRun}>
                <Text style={[styles.twoMinTimer, { color: theme.accent }]}>
                  ✓ 2 minutes in
                </Text>
                <Text style={[styles.twoMinHint, { color: theme.textMuted }]}>
                  Nice — keep going, or mark it done.
                </Text>
                <Pressable onPress={() => setSecondsLeft(null)} hitSlop={8}>
                  <Text style={[styles.twoMinStop, { color: theme.primary }]}>Reset timer</Text>
                </Pressable>
              </View>
            )}
          </View>
        )
      )}

      {/* All steps (collapsible) */}
      <Pressable
        onPress={() => setShowAll((v) => !v)}
        style={styles.toggleRow}
      >
        <Text style={[styles.toggleText, { color: theme.textMuted }]}>
          {showAll ? 'Hide all steps' : 'Show all steps'}
        </Text>
        <Text style={{ color: theme.textMuted }}>{showAll ? '▲' : '▼'}</Text>
      </Pressable>

      {showAll &&
        routine.steps.map((s, i) => {
          const isDone = done.has(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => toggleStep(routine.id, s.id)}
              style={[
                styles.stepRow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isDone ? routine.color : 'transparent',
                    borderColor: isDone ? routine.color : theme.border,
                  },
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.stepText,
                  {
                    color: isDone ? theme.textMuted : theme.text,
                    textDecorationLine: isDone ? 'line-through' : 'none',
                  },
                ]}
              >
                {i + 1}. {s.text}
              </Text>
            </Pressable>
          );
        })}

      {doneCount > 0 && (
        <Pressable
          onPress={() => resetRoutineForToday(routine.id)}
          style={styles.reset}
        >
          <Text style={[styles.resetText, { color: theme.textMuted }]}>
            Reset today’s progress
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  emojiWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 22,
    marginBottom: 8,
  },
  focusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  focusText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 22,
    lineHeight: 30,
  },
  doneBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  twoMin: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  twoMinText: { fontWeight: '700', fontSize: 15 },
  twoMinRun: { marginTop: 14, alignItems: 'center', gap: 4 },
  twoMinTimer: { fontSize: 34, fontWeight: '800' },
  twoMinHint: { fontSize: 13, textAlign: 'center' },
  twoMinStop: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  card: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    marginBottom: 8,
  },
  bigEmoji: { fontSize: 44, marginBottom: 8 },
  doneTitle: { fontSize: 20, fontWeight: '800' },
  doneText: { fontSize: 15, marginTop: 6, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 6,
  },
  toggleText: { fontSize: 14, fontWeight: '700' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontWeight: '800', fontSize: 15 },
  stepText: { flex: 1, fontSize: 16, fontWeight: '600' },
  reset: { marginTop: 18, alignItems: 'center', paddingVertical: 10 },
  resetText: { fontSize: 14, fontWeight: '600' },
});
