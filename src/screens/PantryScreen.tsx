import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { buildPantry, PantryEntry, PantryStatus } from '../utils/pantry';
import { dateKey, relativeDays } from '../utils/dates';
import { money } from '../utils/money';

const STATUS_META: Record<PantryStatus, { label: string; color: string }> = {
  low: { label: 'Out / overdue', color: '#D96A6A' },
  soon: { label: 'Running low', color: '#E0A458' },
  stocked: { label: 'Stocked', color: '#3BA99C' },
};

export function PantryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { receipts, list, addItem } = useShopping();

  const today = dateKey();
  const pantry = useMemo(() => buildPantry(receipts, today), [receipts, today]);
  const onList = useMemo(
    () => new Set(list.filter((i) => !i.checked).map((i) => i.name.toLowerCase())),
    [list]
  );

  const grouped: Record<PantryStatus, PantryEntry[]> = { low: [], soon: [], stocked: [] };
  for (const e of pantry) grouped[e.status].push(e);

  const subtitle = (e: PantryEntry) => {
    if (e.avgIntervalDays == null) {
      return `Bought once · ${relativeDays(-e.daysSinceLast)}`;
    }
    const cadence = `every ~${Math.round(e.avgIntervalDays)}d`;
    if (e.daysLeft == null) return cadence;
    if (e.daysLeft <= 0) return `${cadence} · likely out ${relativeDays(e.daysLeft)}`;
    return `${cadence} · ~${e.daysLeft}d left`;
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Pantry</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Learned from your receipts — no manual inventory. Predictions get sharper
        as you scan more.
      </Text>

      {pantry.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          Scan a couple of receipts and your pantry fills in automatically.
        </Text>
      ) : (
        (['low', 'soon', 'stocked'] as PantryStatus[]).map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;
          const meta = STATUS_META[status];
          return (
            <View key={status} style={{ marginTop: 18 }}>
              <Text style={[styles.section, { color: meta.color }]}>
                {meta.label.toUpperCase()} ({items.length})
              </Text>
              {items.map((e) => {
                const already = onList.has(e.name.toLowerCase());
                const actionable = status !== 'stocked';
                return (
                  <View
                    key={e.name}
                    style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={[styles.dot, { backgroundColor: meta.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: theme.text }]}>{e.name}</Text>
                      <Text style={[styles.meta, { color: theme.textMuted }]}>
                        {subtitle(e)} · ~{money(e.avgPrice)}
                      </Text>
                    </View>
                    {actionable &&
                      (already ? (
                        <Text style={[styles.onList, { color: theme.textMuted }]}>on list</Text>
                      ) : (
                        <Pressable
                          onPress={() => addItem(e.name)}
                          style={[styles.addBtn, { backgroundColor: theme.primary }]}
                        >
                          <Text style={styles.addBtnText}>＋ Add</Text>
                        </Pressable>
                      ))}
                  </View>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  empty: { fontSize: 15, lineHeight: 22, marginTop: 20 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 3 },
  onList: { fontSize: 13, fontWeight: '600' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
