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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, routineColors } from '../theme';
import { useRoutines } from '../store/RoutinesContext';
import { RootStackParamList } from '../navigation/types';
import { Routine, Step } from '../types';
import { uid } from '../utils/id';
import { dateKey } from '../utils/dates';
import { refillStatus } from '../utils/refills';
import { DayPicker } from '../components/DayPicker';
import { TimePicker } from '../components/TimePicker';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'RoutineEditor'>;

const EMOJIS = ['☀️', '🌙', '💊', '🧠', '🏃', '🍎', '📚', '🧹', '💧', '🧘', '📝', '🎯'];

export function RoutineEditorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { getRoutine, upsertRoutine, deleteRoutine } = useRoutines();

  const existing = route.params?.routineId
    ? getRoutine(route.params.routineId)
    : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🎯');
  const [color, setColor] = useState(existing?.color ?? routineColors[0]);
  const [days, setDays] = useState<number[]>(
    existing?.days ?? [1, 2, 3, 4, 5]
  );
  const [time, setTime] = useState<string>(existing?.time ?? '08:00');
  const [reminderEnabled, setReminderEnabled] = useState(
    existing?.reminderEnabled ?? true
  );
  const [steps, setSteps] = useState<Step[]>(
    existing?.steps ?? [{ id: uid(), text: '' }]
  );
  const [restockEnabled, setRestockEnabled] = useState(!!existing?.restock);
  const [refillItem, setRefillItem] = useState(existing?.restock?.itemName ?? '');
  const [daysPerRefill, setDaysPerRefill] = useState(existing?.restock?.daysPerRefill ?? 30);
  const [leadDays, setLeadDays] = useState(existing?.restock?.leadDays ?? 7);
  const [lastFilledKey, setLastFilledKey] = useState(
    existing?.restock?.lastFilledKey ?? dateKey()
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit routine' : 'New routine' });
  }, [navigation, existing]);

  const setStepText = (id: string, text: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));

  const addStep = () =>
    setSteps((prev) => [...prev, { id: uid(), text: '' }]);

  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  const onSave = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Name needed', 'Give your routine a short name.');
      return;
    }
    const cleanSteps = steps
      .map((s) => ({ ...s, text: s.text.trim() }))
      .filter((s) => s.text.length > 0);
    if (cleanSteps.length === 0) {
      Alert.alert('Add a step', 'A routine needs at least one step.');
      return;
    }
    if (days.length === 0) {
      Alert.alert('Pick days', 'Choose at least one day for this routine.');
      return;
    }
    if (restockEnabled && !refillItem.trim()) {
      Alert.alert('Refill item needed', 'Name what to add to the shopping list when it runs low.');
      return;
    }

    const routine: Routine = {
      id: existing?.id ?? uid(),
      name: cleanName,
      emoji,
      color,
      days,
      time: reminderEnabled ? time : null,
      reminderEnabled,
      steps: cleanSteps,
      notificationIds: existing?.notificationIds ?? [],
      restock: restockEnabled
        ? { itemName: refillItem.trim(), daysPerRefill, lastFilledKey, leadDays }
        : null,
    };
    await upsertRoutine(routine);
    navigation.goBack();
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete routine', `Delete “${existing.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const Label = ({ children }: { children: string }) => (
    <Text style={[styles.label, { color: theme.textMuted }]}>{children}</Text>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name + emoji */}
        <Label>NAME</Label>
        <View style={styles.nameRow}>
          <View
            style={[styles.emojiPreview, { backgroundColor: color + '22' }]}
          >
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning start"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
              },
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
              <Text style={{ fontSize: 22 }}>{e}</Text>
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
                {
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: theme.text,
                },
              ]}
              accessibilityLabel={`Color ${c}`}
            />
          ))}
        </View>

        <Label>REPEAT ON</Label>
        <DayPicker selected={days} onChange={setDays} />

        {/* Reminder */}
        <View style={styles.reminderHeader}>
          <Label>REMINDER</Label>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>
        {reminderEnabled && (
          <View
            style={[
              styles.timeBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <TimePicker value={time} onChange={setTime} />
          </View>
        )}

        {/* Steps */}
        <Label>STEPS</Label>
        {steps.map((s, i) => (
          <View key={s.id} style={styles.stepRow}>
            <Text style={[styles.stepNum, { color: theme.textMuted }]}>
              {i + 1}
            </Text>
            <TextInput
              value={s.text}
              onChangeText={(t) => setStepText(s.id, t)}
              placeholder="Describe one small step"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  flex: 1,
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
            {steps.length > 1 && (
              <Pressable
                onPress={() => removeStep(s.id)}
                style={styles.stepRemove}
                accessibilityLabel={`Remove step ${i + 1}`}
              >
                <Text style={{ color: theme.danger, fontSize: 20 }}>×</Text>
              </Pressable>
            )}
          </View>
        ))}
        <Pressable
          onPress={addStep}
          style={[styles.addStep, { borderColor: theme.border }]}
        >
          <Text style={[styles.addStepText, { color: theme.primary }]}>
            ＋ Add step
          </Text>
        </Pressable>

        {/* Refill / restock (meds → shopping list) */}
        <View style={styles.reminderHeader}>
          <Label>REFILL REMINDER</Label>
          <Switch
            value={restockEnabled}
            onValueChange={setRestockEnabled}
            trackColor={{ true: theme.accent, false: theme.border }}
          />
        </View>
        {restockEnabled && (
          <View style={[styles.timeBox, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'stretch' }]}>
            <Text style={[styles.refillHint, { color: theme.textMuted }]}>
              For consumables like meds. When the supply runs low it lands on your
              shopping list automatically.
            </Text>
            <TextInput
              value={refillItem}
              onChangeText={setRefillItem}
              placeholder="Add to list as… e.g. Evening meds refill"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { marginTop: 12, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
              ]}
            />

            <Text style={[styles.miniLabel, { color: theme.textMuted }]}>SUPPLY LASTS</Text>
            <View style={styles.chipRow}>
              {[30, 60, 90].map((d) => {
                const on = daysPerRefill === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDaysPerRefill(d)}
                    style={[styles.miniChip, { backgroundColor: on ? theme.primary : theme.bg, borderColor: on ? theme.primary : theme.border }]}
                  >
                    <Text style={{ color: on ? '#fff' : theme.text, fontWeight: '700' }}>{d} days</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.miniLabel, { color: theme.textMuted }]}>REMIND BEFORE</Text>
            <View style={styles.chipRow}>
              {[3, 7, 14].map((d) => {
                const on = leadDays === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setLeadDays(d)}
                    style={[styles.miniChip, { backgroundColor: on ? theme.primary : theme.bg, borderColor: on ? theme.primary : theme.border }]}
                  >
                    <Text style={{ color: on ? '#fff' : theme.text, fontWeight: '700' }}>{d} days</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setLastFilledKey(dateKey())}
              style={[styles.filledRow, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                Last filled: {lastFilledKey}
              </Text>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Filled today</Text>
            </Pressable>
            {(() => {
              const s = refillStatus(
                { restock: { itemName: refillItem, daysPerRefill, lastFilledKey, leadDays } } as any,
                dateKey()
              );
              return s ? (
                <Text style={[styles.refillHint, { color: theme.textMuted, marginTop: 8 }]}>
                  {s.daysLeft <= 0 ? 'Out of supply now.' : `~${s.daysLeft} days of supply left.`}
                </Text>
              ) : null;
            })()}
          </View>
        )}

        {/* Actions */}
        <Pressable
          onPress={onSave}
          style={[styles.save, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.saveText}>Save routine</Text>
        </Pressable>

        {existing && (
          <Pressable onPress={onDelete} style={styles.delete}>
            <Text style={[styles.deleteText, { color: theme.danger }]}>
              Delete routine
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },
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
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum: { width: 18, textAlign: 'center', fontWeight: '700', fontSize: 15 },
  stepRemove: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  addStep: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  addStepText: { fontWeight: '700', fontSize: 15 },
  refillHint: { fontSize: 13, lineHeight: 19 },
  miniLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  miniChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  save: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  delete: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  deleteText: { fontWeight: '700', fontSize: 15 },
});
