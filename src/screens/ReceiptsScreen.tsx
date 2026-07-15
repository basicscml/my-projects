import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { spendByStore } from '../utils/suggestions';
import { money } from '../utils/money';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ReceiptsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { receipts } = useShopping();

  const spend = useMemo(() => spendByStore(receipts), [receipts]);
  const grandTotal = useMemo(
    () => receipts.reduce((sum, r) => sum + r.total, 0),
    [receipts]
  );
  const maxStore = spend.length ? spend[0].total : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 96 }}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Receipts</Text>
          <View style={styles.headerLinks}>
            <Pressable onPress={() => navigation.navigate('Compare')}>
              <Text style={[styles.link, { color: theme.primary }]}>Compare</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Stores')}>
              <Text style={[styles.link, { color: theme.primary }]}>Stores</Text>
            </Pressable>
          </View>
        </View>

        {/* Spend summary */}
        {receipts.length > 0 && (
          <View
            style={[
              styles.summary,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              TOTAL SPEND · {receipts.length} receipt
              {receipts.length === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.summaryTotal, { color: theme.text }]}>
              {money(grandTotal)}
            </Text>
            <View style={{ marginTop: 14, gap: 10 }}>
              {spend.map((s) => (
                <View key={s.storeName + s.total} style={styles.barRow}>
                  <Text
                    style={[styles.barName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {s.storeName}
                  </Text>
                  <View style={styles.barTrackWrap}>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: theme.cardAlt },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: theme.primary,
                            width: `${maxStore ? (s.total / maxStore) * 100 : 0}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.barVal, { color: theme.textMuted }]}>
                    {money(s.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Receipt list */}
        {receipts.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            No receipts yet. Scan one to start tracking what you buy and spend.
          </Text>
        ) : (
          receipts.map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                navigation.navigate('ReceiptDetail', { receiptId: r.id })
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {r.storeName}
                </Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                  {r.dateKey} · {r.items.length} item
                  {r.items.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={[styles.cardTotal, { color: theme.text }]}>
                {money(r.total)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('ScanReceipt')}
        style={[
          styles.scanBtn,
          { backgroundColor: theme.primary, bottom: insets.bottom + 20 },
        ]}
      >
        <Text style={styles.scanBtnText}>＋ Scan receipt</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLinks: { flexDirection: 'row', gap: 16 },
  link: { fontWeight: '700', fontSize: 15 },
  title: { fontSize: 30, fontWeight: '800' },
  summary: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 20 },
  summaryLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  summaryTotal: { fontSize: 34, fontWeight: '800', marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barName: { width: 96, fontSize: 13, fontWeight: '600' },
  barTrackWrap: { flex: 1 },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barVal: { width: 64, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },
  cardTotal: { fontSize: 18, fontWeight: '800' },
  scanBtn: {
    position: 'absolute',
    right: 20,
    left: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  scanBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
