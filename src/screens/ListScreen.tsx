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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { buildPantry, recentlyBought, runningLow } from '../utils/pantry';
import { dateKey } from '../utils/dates';

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
  const today = dateKey();

  // Predicted "running low" from receipts, minus what's already on the list.
  const lowItems = useMemo(() => {
    const onList = new Set(active.map((i) => i.name.toLowerCase()));
    return runningLow(buildPantry(receipts, today))
      .filter((e) => !onList.has(e.name.toLowerCase()))
      .slice(0, 8);
  }, [receipts, active, today]);

  const commitAdd = (name: string) => {
    addItem(name);
    setDraft('');
  };

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    // "Did I already buy this?" — catch accidental re-buys.
    const boughtOn = recentlyBought(receipts, name, 4, today);
    if (boughtOn) {
      Alert.alert(
        'Already bought?',
        `You bought ${name} on ${boughtOn}. Add it to the list anyway?`,
        [
          { text: 'Skip', style: 'cancel', onPress: () => setDraft('') },
          { text: 'Add anyway', onPress: () => commitAdd(name) },
        ]
      );
      return;
    }
    commitAdd(name);
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
          <View style={styles.headerLinks}>
            <Pressable onPress={() => navigation.navigate('Pantry')}>
              <Text style={[styles.link, { color: theme.primary }]}>Pantry</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('IngredientScan')}>
              <Text style={[styles.link, { color: theme.primary }]}>🔬 Scan</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Stores')}>
              <Text style={[styles.link, { color: theme.primary }]}>Stores</Text>
            </Pressable>
          </View>
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

        {/* Running low — predicted from receipts */}
        {lowItems.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.section2}>
              <Text style={[styles.section, { color: theme.textMuted }]}>
                RUNNING LOW — predicted
              </Text>
              <Pressable onPress={() => navigation.navigate('Pantry')}>
                <Text style={[styles.link, { color: theme.primary }]}>Pantry →</Text>
              </Pressable>
            </View>
            <View style={styles.chips}>
              {lowItems.map((s) => (
                <Pressable
                  key={s.name}
                  onPress={() => addItem(s.name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.card,
                      borderColor: s.status === 'low' ? theme.danger : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    ＋ {s.name}
                  </Text>
                  <Text style={[styles.chipMeta, { color: theme.textMuted }]}>
                    {s.status === 'low'
                      ? 'likely out'
                      : `~${s.daysLeft}d left`}
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
  headerLinks: { flexDirection: 'row', gap: 16 },
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
