import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { restockSuggestions } from '../utils/suggestions';
import { money } from '../utils/money';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { list, receipts, addItem, toggleItem, removeItem, clearChecked } =
    useShopping();
  const [draft, setDraft] = useState('');

  const active = list.filter((i) => !i.checked);
  const done = list.filter((i) => i.checked);

  const suggestions = useMemo(
    () => restockSuggestions(receipts, list.map((i) => i.name), 6),
    [receipts, list]
  );

  const submit = () => {
    if (!draft.trim()) return;
    addItem(draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Shopping list</Text>
          <Pressable onPress={() => navigation.navigate('Stores')}>
            <Text style={[styles.link, { color: theme.primary }]}>Stores</Text>
          </Pressable>
        </View>

        {/* Add box */}
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder="Add an item…"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
          />
          <Pressable
            onPress={submit}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Active items */}
        {active.length === 0 && done.length === 0 && (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            Your list is empty. Add something above, or tap a suggestion.
          </Text>
        )}

        {active.map((item) => (
          <ItemRow
            key={item.id}
            name={item.name}
            qty={item.qty}
            checked={false}
            onToggle={() => toggleItem(item.id)}
            onRemove={() => removeItem(item.id)}
          />
        ))}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <Text style={[styles.section, { color: theme.textMuted }]}>
              RESTOCK — from your receipts
            </Text>
            <View style={styles.chips}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.name}
                  onPress={() => addItem(s.name)}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    ＋ {s.name}
                  </Text>
                  <Text style={[styles.chipMeta, { color: theme.textMuted }]}>
                    {s.timesBought}× · ~{money(s.avgPrice)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Checked items */}
        {done.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.section2}>
              <Text style={[styles.section, { color: theme.textMuted }]}>
                IN THE CART ({done.length})
              </Text>
              <Pressable onPress={clearChecked}>
                <Text style={[styles.link, { color: theme.danger }]}>Clear</Text>
              </Pressable>
            </View>
            {done.map((item) => (
              <ItemRow
                key={item.id}
                name={item.name}
                qty={item.qty}
                checked
                onToggle={() => toggleItem(item.id)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ItemRow({
  name,
  qty,
  checked,
  onToggle,
  onRemove,
}: {
  name: string;
  qty: number;
  checked: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <Pressable onPress={onToggle} style={styles.itemTap} hitSlop={6}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: checked ? theme.accent : 'transparent',
              borderColor: checked ? theme.accent : theme.border,
            },
          ]}
        >
          {checked && <Text style={styles.check}>✓</Text>}
        </View>
        <Text
          style={[
            styles.itemName,
            {
              color: checked ? theme.textMuted : theme.text,
              textDecorationLine: checked ? 'line-through' : 'none',
            },
          ]}
        >
          {name}
          {qty > 1 ? `  ×${qty}` : ''}
        </Text>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
        <Text style={{ color: theme.textMuted, fontSize: 18 }}>×</Text>
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
  title: { fontSize: 30, fontWeight: '800' },
  link: { fontWeight: '700', fontSize: 15 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addBtn: {
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  itemTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  remove: { paddingLeft: 10 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  section2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontWeight: '700', fontSize: 14 },
  chipMeta: { fontSize: 11, marginTop: 2 },
});
