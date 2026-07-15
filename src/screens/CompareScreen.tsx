import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { buildComparisons, ProductComparison, valueVerdict } from '../utils/compare';
import { formatUnitPrice } from '../utils/units';
import { dateKey } from '../utils/dates';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Sort = 'savings' | 'cheapest' | 'healthiest';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'savings', label: 'Best savings' },
  { key: 'cheapest', label: 'Cheapest / oz' },
  { key: 'healthiest', label: 'Healthiest' },
];

export function CompareScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { receipts, productHealth } = useShopping();
  const [sort, setSort] = useState<Sort>('savings');

  const today = dateKey();
  const all = useMemo(
    () => buildComparisons(receipts, productHealth, today),
    [receipts, productHealth, today]
  );

  const sorted = useMemo(() => {
    const arr = [...all];
    if (sort === 'cheapest') {
      arr.sort((a, b) => (a.best?.unit.value ?? 9e9) - (b.best?.unit.value ?? 9e9));
    } else if (sort === 'healthiest') {
      arr.sort((a, b) => (b.health?.score ?? -1) - (a.health?.score ?? -1));
    }
    return arr;
  }, [all, sort]);

  const healthColor = (score: number) =>
    score >= 80 ? theme.accent : score >= 60 ? '#7BA05B' : score >= 40 ? theme.amber : theme.danger;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        <Text style={[styles.title, { color: theme.text }]}>Compare</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Per-unit prices across stores, built from your receipts. Add sizes and
          ingredient scores to sharpen it.
        </Text>

        <View style={styles.sortRow}>
          {SORTS.map((s) => {
            const on = sort === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={[
                  styles.sortChip,
                  { backgroundColor: on ? theme.primary : theme.card, borderColor: on ? theme.primary : theme.border },
                ]}
              >
                <Text style={{ color: on ? '#fff' : theme.text, fontWeight: '700', fontSize: 13 }}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {sorted.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            Scan a few receipts (with item sizes) and this fills in. The more
            stores you shop, the better the comparison.
          </Text>
        ) : (
          sorted.map((c) => <CompareCard key={c.name} c={c} healthColor={healthColor} navigation={navigation} />)
        )}
      </ScrollView>
    </View>
  );
}

function CompareCard({
  c,
  healthColor,
  navigation,
}: {
  c: ProductComparison;
  healthColor: (s: number) => string;
  navigation: Nav;
}) {
  const theme = useTheme();
  const multiStore = c.stores.length > 1;
  return (
    <Pressable
      onPress={() => navigation.navigate('CompareDetail', { name: c.name })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.cardHead}>
        <Text style={[styles.cardName, { color: theme.text }]}>{c.name}</Text>
        {c.health && (
          <View style={[styles.healthBadge, { backgroundColor: healthColor(c.health.score) }]}>
            <Text style={styles.healthBadgeText}>{c.health.score}</Text>
          </View>
        )}
      </View>

      {c.best ? (
        <Text style={[styles.cardPrice, { color: theme.text }]}>
          {formatUnitPrice(c.best.unit)}
          <Text style={[styles.cardPriceSub, { color: theme.textMuted }]}>
            {' '}
            · cheapest at {c.best.obs.store}
          </Text>
        </Text>
      ) : (
        <Text style={[styles.cardPriceSub, { color: theme.textMuted }]}>
          Add a size to get a per-unit price
        </Text>
      )}

      <Text style={[styles.verdict, { color: theme.textMuted }]}>{valueVerdict(c)}</Text>

      <View style={styles.tags}>
        {multiStore && (
          <Tag text={`${c.stores.length} stores`} color={theme.primary} theme={theme} />
        )}
        {c.savings >= 0.1 && c.best && (
          <Tag text={`save ${Math.round(c.savings * 100)}%`} color={theme.accent} theme={theme} />
        )}
        {c.interval?.status === 'low' && (
          <Tag text="likely out" color={theme.danger} theme={theme} />
        )}
        {c.interval?.avgIntervalDays != null && c.interval.status !== 'low' && (
          <Tag text={`every ~${Math.round(c.interval.avgIntervalDays)}d`} color={theme.textMuted} theme={theme} />
        )}
      </View>
    </Pressable>
  );
}

function Tag({ text, color, theme }: { text: string; color: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 14 },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sortChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  empty: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 18, fontWeight: '800', flex: 1 },
  healthBadge: { minWidth: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  healthBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cardPrice: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  cardPriceSub: { fontSize: 13, fontWeight: '600' },
  verdict: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
