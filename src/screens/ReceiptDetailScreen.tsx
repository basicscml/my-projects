import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { money } from '../utils/money';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ReceiptDetail'>;

export function ReceiptDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { receipts, deleteReceipt, addItem } = useShopping();

  const receipt = receipts.find((r) => r.id === route.params.receiptId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: receipt?.storeName ?? 'Receipt' });
  }, [navigation, receipt]);

  if (!receipt) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>Receipt not found.</Text>
      </View>
    );
  }

  const onDelete = () =>
    Alert.alert('Delete receipt', 'Remove this receipt from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteReceipt(receipt.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
    >
      <Text style={[styles.store, { color: theme.text }]}>{receipt.storeName}</Text>
      <Text style={[styles.meta, { color: theme.textMuted }]}>
        {receipt.dateKey} · {receipt.items.length} items · {receipt.source}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {receipt.items.map((item, i) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              { borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: theme.border },
            ]}
          >
            <Text style={[styles.itemName, { color: theme.text }]}>
              {item.qty > 1 ? `${item.qty}× ` : ''}
              {item.name}
            </Text>
            <View style={styles.itemRight}>
              <Text style={[styles.itemPrice, { color: theme.text }]}>
                {money(item.price)}
              </Text>
              <Pressable onPress={() => addItem(item.name)} hitSlop={6}>
                <Text style={[styles.reAdd, { color: theme.primary }]}>+ list</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalVal, { color: theme.text }]}>
            {money(receipt.total)}
          </Text>
        </View>
      </View>

      <Pressable onPress={onDelete} style={styles.delete}>
        <Text style={[styles.deleteText, { color: theme.danger }]}>Delete receipt</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  store: { fontSize: 26, fontWeight: '800' },
  meta: { fontSize: 14, marginTop: 4, marginBottom: 18, textTransform: 'capitalize' },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  itemName: { fontSize: 16, fontWeight: '600', flex: 1, paddingRight: 12 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700' },
  reAdd: { fontSize: 12, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 17, fontWeight: '800' },
  totalVal: { fontSize: 18, fontWeight: '800' },
  delete: { marginTop: 22, alignItems: 'center', paddingVertical: 12 },
  deleteText: { fontWeight: '700', fontSize: 15 },
});
