import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Dependency-free time picker: hour + minute steppers with an AM/PM toggle.
 * Value/onChange use 24h "HH:MM" strings.
 */
export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const theme = useTheme();
  const [hStr, mStr] = value.split(':');
  const hour24 = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  const isPM = hour24 >= 12;
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const emit = (h12: number, min: number, pm: boolean) => {
    let h24 = h12 % 12;
    if (pm) h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  const stepHour = (dir: number) => {
    let h = hour12 + dir;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    emit(h, minute, isPM);
  };

  const stepMinute = (dir: number) => {
    let m = minute + dir * 5;
    if (m >= 60) m = 0;
    if (m < 0) m = 55;
    emit(hour12, m, isPM);
  };

  const Stepper = ({
    text,
    onUp,
    onDown,
    a11y,
  }: {
    text: string;
    onUp: () => void;
    onDown: () => void;
    a11y: string;
  }) => (
    <View style={styles.stepper}>
      <Pressable
        onPress={onUp}
        style={[styles.stepBtn, { backgroundColor: theme.cardAlt }]}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${a11y}`}
      >
        <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
      </Pressable>
      <Text style={[styles.value, { color: theme.text }]}>{text}</Text>
      <Pressable
        onPress={onDown}
        style={[styles.stepBtn, { backgroundColor: theme.cardAlt }]}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${a11y}`}
      >
        <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.row}>
      <Stepper
        text={String(hour12)}
        onUp={() => stepHour(1)}
        onDown={() => stepHour(-1)}
        a11y="hour"
      />
      <Text style={[styles.colon, { color: theme.text }]}>:</Text>
      <Stepper
        text={String(minute).padStart(2, '0')}
        onUp={() => stepMinute(1)}
        onDown={() => stepMinute(-1)}
        a11y="minutes"
      />
      <View style={styles.ampm}>
        {(['AM', 'PM'] as const).map((label) => {
          const on = (label === 'PM') === isPM;
          return (
            <Pressable
              key={label}
              onPress={() => emit(hour12, minute, label === 'PM')}
              style={[
                styles.ampmBtn,
                {
                  backgroundColor: on ? theme.primary : theme.cardAlt,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text
                style={[
                  styles.ampmText,
                  { color: on ? '#fff' : theme.textMuted },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper: { alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 46,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '700' },
  value: { fontSize: 30, fontWeight: '800', minWidth: 46, textAlign: 'center' },
  colon: { fontSize: 30, fontWeight: '800', marginBottom: 4 },
  ampm: { marginLeft: 8, gap: 6 },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  ampmText: { fontWeight: '700', fontSize: 14 },
});
