import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { Receipt, ReceiptItem } from '../types';
import { parseReceipt } from '../utils/receiptParser';
import { SAMPLE_RECEIPT_TEXT } from '../store/seed';
import { uid } from '../utils/id';
import { dateKey } from '../utils/dates';
import { money, parsePrice } from '../utils/money';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ScanReceiptScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { stores, addReceipt } = useShopping();

  const [step, setStep] = useState<'capture' | 'review'>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');

  // Review fields
  const [storeName, setStoreName] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [date, setDate] = useState(dateKey());
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [total, setTotal] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: step === 'capture' ? 'Scan receipt' : 'Review' });
  }, [navigation, step]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.price || 0), 0),
    [items]
  );

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        `Allow ${fromCamera ? 'camera' : 'photo'} access to add a receipt image.`
      );
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.5 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const runParse = (text: string) => {
    const parsed = parseReceipt(text);
    setStoreName(parsed.storeName ?? '');
    if (parsed.dateKey) setDate(parsed.dateKey);
    setItems(
      parsed.items.length
        ? parsed.items
        : [{ id: uid(), name: '', price: 0, qty: 1 }]
    );
    setTotal(parsed.total != null ? parsed.total.toFixed(2) : '');
    // Try to auto-match a saved store by name.
    if (parsed.storeName) {
      const match = stores.find((s) =>
        parsed.storeName!.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        setStoreId(match.id);
        setStoreName(match.name);
      }
    }
    setStep('review');
  };

  const useSample = () => {
    setRawText(SAMPLE_RECEIPT_TEXT);
    runParse(SAMPLE_RECEIPT_TEXT);
  };

  const setItem = (id: string, patch: Partial<ReceiptItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addItemRow = () =>
    setItems((prev) => [...prev, { id: uid(), name: '', price: 0, qty: 1 }]);

  const removeItemRow = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const save = () => {
    const cleanItems = items
      .map((i) => ({ ...i, name: i.name.trim() }))
      .filter((i) => i.name.length > 0);
    if (!storeName.trim()) {
      Alert.alert('Store needed', 'Enter or pick a store for this receipt.');
      return;
    }
    if (cleanItems.length === 0) {
      Alert.alert('No items', 'Add at least one item to save the receipt.');
      return;
    }
    const totalNum = total.trim() ? parsePrice(total) ?? subtotal : subtotal;
    const receipt: Receipt = {
      id: uid(),
      storeName: storeName.trim(),
      storeId,
      dateKey: date,
      total: totalNum,
      items: cleanItems,
      source: 'parsed',
    };
    addReceipt(receipt);
    navigation.goBack();
  };

  const Label = ({ children }: { children: string }) => (
    <Text style={[styles.label, { color: theme.textMuted }]}>{children}</Text>
  );

  // ---- Capture step ----
  if (step === 'capture') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.captureRow}>
            <CaptureBtn label="Take photo" icon="📷" onPress={() => pickImage(true)} />
            <CaptureBtn label="Pick photo" icon="🖼️" onPress={() => pickImage(false)} />
          </View>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}

          <Label>RECEIPT TEXT</Label>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Paste the receipt text (or type it) and we’ll pull out the items,
            store, date, and total. On-device reading of the photo drops in
            here next.
          </Text>
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            multiline
            placeholder={'STORE NAME\n07/15/2026\nBananas   1.29\nOat Milk  3.99\nTOTAL     5.28'}
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textArea,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Pressable
            onPress={() => runParse(rawText)}
            disabled={!rawText.trim()}
            style={[
              styles.primary,
              { backgroundColor: rawText.trim() ? theme.primary : theme.border },
            ]}
          >
            <Text style={styles.primaryText}>Read receipt →</Text>
          </Pressable>

          <Pressable onPress={useSample} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: theme.primary }]}>
              Try a sample receipt
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---- Review step ----
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <Label>STORE</Label>
        <TextInput
          value={storeName}
          onChangeText={(t) => {
            setStoreName(t);
            setStoreId(null);
          }}
          placeholder="Store name"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
        />
        {stores.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {stores.map((s) => {
                const on = storeId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setStoreId(s.id);
                      setStoreName(s.name);
                    }}
                    style={[
                      styles.storeChip,
                      {
                        backgroundColor: on ? theme.primary : theme.card,
                        borderColor: on ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: on ? '#fff' : theme.text, fontWeight: '600' }}>
                      {s.emoji} {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        <Label>DATE</Label>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
        />

        <Label>ITEMS</Label>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <TextInput
              value={item.name}
              onChangeText={(t) => setItem(item.id, { name: t })}
              placeholder="Item"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
            />
            <TextInput
              value={item.size ?? ''}
              onChangeText={(t) => setItem(item.id, { size: t })}
              placeholder="size"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.sizeInput,
                { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
            />
            <TextInput
              value={item.price ? String(item.price) : ''}
              onChangeText={(t) => setItem(item.id, { price: parsePrice(t) ?? 0 })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.priceInput,
                { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
            />
            <Pressable onPress={() => removeItemRow(item.id)} hitSlop={8} style={styles.remove}>
              <Text style={{ color: theme.danger, fontSize: 20 }}>×</Text>
            </Pressable>
          </View>
        ))}
        <Text style={[styles.sizeHint, { color: theme.textMuted }]}>
          Add a size (e.g. “64 fl oz”, “1 lb”, “12 ct”) to unlock per-oz price
          comparison across stores.
        </Text>
        <Pressable onPress={addItemRow} style={[styles.addStep, { borderColor: theme.border }]}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>＋ Add item</Text>
        </Pressable>

        <View style={styles.totalRow}>
          <Label>TOTAL</Label>
          <Text style={[styles.subtotalHint, { color: theme.textMuted }]}>
            items add to {money(subtotal)}
          </Text>
        </View>
        <TextInput
          value={total}
          onChangeText={setTotal}
          placeholder={subtotal.toFixed(2)}
          keyboardType="decimal-pad"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
        />

        <Pressable onPress={save} style={[styles.primary, { backgroundColor: theme.primary }]}>
          <Text style={styles.primaryText}>Save receipt</Text>
        </Pressable>
        <Pressable onPress={() => setStep('capture')} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: theme.textMuted }]}>Back</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CaptureBtn({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.captureBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={[styles.captureText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  captureRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  captureBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  captureText: { fontWeight: '700', fontSize: 15 },
  preview: { width: '100%', height: 180, borderRadius: 14, marginBottom: 8 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sizeInput: {
    width: 62,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  priceInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  sizeHint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  remove: { paddingHorizontal: 2 },
  addStep: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotalHint: { fontSize: 12, marginBottom: 8 },
  storeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  primary: {
    marginTop: 26,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700', fontSize: 15 },
});
