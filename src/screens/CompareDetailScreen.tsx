import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { buildComparisons, valueVerdict } from '../utils/compare';
import { formatUnitPrice } from '../utils/units';
import { money } from '../utils/money';
import { dateKey, relativeDays } from '../utils/dates';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'CompareDetail'>;

export function CompareDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { receipts, productHealth } = useShopping();

  const today = dateKey();
  const c = useMemo(
    () =>
      buildComparisons(receipts, productHealth, today).find(
        (x) => x.name.toLowerCase() === route.params.name.toLowerCase()
      ),
    [receipts, productHealth, today, route.params.name]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: c?.name ?? 'Compare' });
  }, [navigation, c]);

  // Best per-unit observation per store (for the cross-store table).
  // Computed before any early return so hook order stays stable.
  const perStore = useMemo(() => {
    const map = new Map<
      string,
      { store: string; unitValue: number | null; unitText: string; size: string | null; price: number; dateKey: string }
    >();
    if (!c) return [];
    for (const o of c.observations) {
      const prev = map.get(o.store);
      const unitValue = o.unit ? o.unit.value : null;
      if (!prev || (unitValue != null && (prev.unitValue == null || unitValue < prev.unitValue))) {
        map.set(o.store, {
          store: o.store,
          unitValue,
          unitText: o.unit ? formatUnitPrice(o.unit) : '—',
          size: o.sizeText,
          price: o.linePrice,
          dateKey: o.dateKey,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.unitValue ?? 9e9) - (b.unitValue ?? 9e9));
  }, [c]);

  if (!c) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>No data for this product.</Text>
      </View>
    );
  }

  const healthColor = (score: number) =>
    score >= 80 ? theme.accent : score >= 60 ? '#7BA05B' : score >= 40 ? theme.amber : theme.danger;

  const bestStore = c.best?.obs.store;

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
    >
      {/* Verdict banner */}
      <View style={[styles.verdictCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
        <Text style={[styles.verdictText, { color: theme.text }]}>{valueVerdict(c)}</Text>
        {c.best && (
          <Text style={[styles.verdictSub, { color: theme.textMuted }]}>
            Best value: {formatUnitPrice(c.best.unit)} at {c.best.obs.store}
            {c.savings >= 0.1 ? ` · ${Math.round(c.savings * 100)}% cheaper than the priciest` : ''}
          </Text>
        )}
      </View>

      {/* Health */}
      <View style={styles.rowBetween}>
        <Text style={[styles.section, { color: theme.textMuted }]}>HEALTH</Text>
        <Pressable onPress={() => navigation.navigate('IngredientScan')}>
          <Text style={[styles.link, { color: theme.primary }]}>🔬 Scan ingredients</Text>
        </Pressable>
      </View>
      {c.health ? (
        <View style={[styles.healthRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.healthBadge, { backgroundColor: healthColor(c.health.score) }]}>
            <Text style={styles.healthBadgeText}>{c.health.score}</Text>
          </View>
          <Text style={[styles.healthGrade, { color: theme.text }]}>{c.health.grade}</Text>
        </View>
      ) : (
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          No health score yet. Scan this product’s ingredients (with its name) to
          weigh health against price here.
        </Text>
      )}

      {/* Cross-store */}
      <Text style={[styles.section, { color: theme.textMuted, marginTop: 22 }]}>
        PRICE BY STORE
      </Text>
      {perStore.map((s) => {
        const isBest = s.store === bestStore && c.best != null;
        return (
          <View
            key={s.store}
            style={[
              styles.storeRow,
              { backgroundColor: theme.card, borderColor: isBest ? theme.accent : theme.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.storeName, { color: theme.text }]}>
                {s.store} {isBest ? '· best value' : ''}
              </Text>
              <Text style={[styles.storeMeta, { color: theme.textMuted }]}>
                {s.size ? `${s.size} · ` : ''}
                {money(s.price)} · {s.dateKey}
              </Text>
            </View>
            <Text style={[styles.storeUnit, { color: isBest ? theme.accent : theme.text }]}>
              {s.unitText}
            </Text>
          </View>
        );
      })}

      {/* Runout */}
      {c.interval?.avgIntervalDays != null && (
        <>
          <Text style={[styles.section, { color: theme.textMuted, marginTop: 22 }]}>REBUY</Text>
          <View style={[styles.storeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.storeName, { color: theme.text }]}>
                You rebuy every ~{Math.round(c.interval.avgIntervalDays)} days
              </Text>
              <Text style={[styles.storeMeta, { color: theme.textMuted }]}>
                Last bought {relativeDays(-c.interval.daysSinceLast)} ·{' '}
                {c.interval.status === 'low'
                  ? 'likely out now'
                  : c.interval.daysLeft != null
                  ? `~${c.interval.daysLeft}d left`
                  : ''}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Full history */}
      <Text style={[styles.section, { color: theme.textMuted, marginTop: 22 }]}>HISTORY</Text>
      {c.observations.map((o, i) => (
        <View key={i} style={styles.histRow}>
          <Text style={[styles.histDate, { color: theme.textMuted }]}>{o.dateKey}</Text>
          <Text style={[styles.histStore, { color: theme.text }]} numberOfLines={1}>
            {o.store}
            {o.sizeText ? ` · ${o.sizeText}` : ''}
          </Text>
          <Text style={[styles.histPrice, { color: theme.text }]}>{money(o.linePrice)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  verdictCard: { borderWidth: 2, borderRadius: 18, padding: 18, marginBottom: 20 },
  verdictText: { fontSize: 17, fontWeight: '800' },
  verdictSub: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  link: { fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 13, lineHeight: 19 },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  healthBadge: { minWidth: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  healthBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  healthGrade: { fontSize: 16, fontWeight: '700' },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  storeName: { fontSize: 16, fontWeight: '700' },
  storeMeta: { fontSize: 13, marginTop: 3 },
  storeUnit: { fontSize: 16, fontWeight: '800' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  histDate: { fontSize: 12, width: 88 },
  histStore: { fontSize: 14, fontWeight: '600', flex: 1 },
  histPrice: { fontSize: 14, fontWeight: '700' },
});
