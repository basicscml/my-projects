import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { WEEKDAYS } from '../utils/dates';

export function DayPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  const theme = useTheme();
  const toggle = (day: number) => {
    if (selected.includes(day)) onChange(selected.filter((d) => d !== day));
    else onChange([...selected, day].sort((a, b) => a - b));
  };

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((label, day) => {
        const on = selected.includes(day);
        return (
          <Pressable
            key={day}
            onPress={() => toggle(day)}
            style={[
              styles.chip,
              {
                backgroundColor: on ? theme.primary : theme.cardAlt,
                borderColor: on ? theme.primary : theme.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
          >
            <Text
              style={[
                styles.chipText,
                { color: on ? '#fff' : theme.textMuted },
              ]}
            >
              {label[0]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontWeight: '700', fontSize: 15 },
});
