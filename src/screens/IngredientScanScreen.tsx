import React, { useLayoutEffect, useState } from 'react';
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
import { RootStackParamList } from '../navigation/types';
import { ProgressRing } from '../components/ProgressRing';
import {
  analyzeIngredients,
  IngredientAnalysis,
  riskColor,
  riskLabel,
  SAMPLE_INGREDIENTS,
} from '../utils/ingredientAnalyzer';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function IngredientScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [raw, setRaw] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<IngredientAnalysis | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Ingredient scan' });
  }, [navigation]);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to add a label photo.');
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.5 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const analyze = (text: string) => {
    if (!text.trim()) return;
    setResult(analyzeIngredients(text));
  };

  const scoreColor = (score: number) =>
    score >= 80 ? theme.accent : score >= 60 ? '#7BA05B' : score >= 40 ? theme.amber : theme.danger;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {!result ? (
          <>
            <Text style={[styles.intro, { color: theme.textMuted }]}>
              Scan or paste the product’s ingredients list. We check each
              ingredient against a curated additive-risk dataset and flag the
              ones worth knowing about.
            </Text>

            <View style={styles.captureRow}>
              <CaptureBtn label="Take photo" icon="📷" onPress={() => pickImage(true)} />
              <CaptureBtn label="Pick photo" icon="🖼️" onPress={() => pickImage(false)} />
            </View>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            )}

            <Text style={[styles.label, { color: theme.textMuted }]}>INGREDIENTS TEXT</Text>
            <TextInput
              value={raw}
              onChangeText={setRaw}
              multiline
              placeholder="Ingredients: sugar, palm oil, E102, sodium benzoate…"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textArea,
                { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
            />

            <Pressable
              onPress={() => analyze(raw)}
              disabled={!raw.trim()}
              style={[styles.primary, { backgroundColor: raw.trim() ? theme.primary : theme.border }]}
            >
              <Text style={styles.primaryText}>Check ingredients →</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRaw(SAMPLE_INGREDIENTS);
                analyze(SAMPLE_INGREDIENTS);
              }}
              style={styles.secondary}
            >
              <Text style={[styles.secondaryText, { color: theme.primary }]}>
                Try a sample label
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Score header */}
            <View
              style={[
                styles.scoreCard,
                { backgroundColor: theme.card, borderColor: scoreColor(result.score) },
              ]}
            >
              <ProgressRing
                progress={result.score / 100}
                color={scoreColor(result.score)}
                size={76}
                label={String(result.score)}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.grade, { color: scoreColor(result.score) }]}>
                  {result.grade}
                </Text>
                <Text style={[styles.gradeSub, { color: theme.textMuted }]}>
                  {result.additiveCount} additive
                  {result.additiveCount === 1 ? '' : 's'} ·{' '}
                  {result.counts.high + result.counts.moderate} to watch
                </Text>
              </View>
            </View>

            <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
              Additive-focused score (nutrition not included). Guidance only, not
              medical advice. Unmatched ingredients are shown as “not in dataset”,
              not as safe.
            </Text>

            {/* Ingredient breakdown */}
            {result.ingredients.map((ing, i) => {
              const info = ing.info;
              const color = info ? riskColor(info.risk) : theme.textMuted;
              return (
                <View
                  key={i}
                  style={[styles.ingRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ingName, { color: theme.text }]}>
                      {info ? info.name : ing.raw}
                    </Text>
                    {info ? (
                      <>
                        <Text style={[styles.ingMeta, { color }]}>
                          {riskLabel(info.risk)} · {info.category}
                        </Text>
                        <Text style={[styles.ingNote, { color: theme.textMuted }]}>
                          {info.note}
                        </Text>
                        <Text style={[styles.ingSource, { color: theme.textMuted }]}>
                          Source: {info.source}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.ingMeta, { color: theme.textMuted }]}>
                        Not in dataset
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={() => {
                setResult(null);
                setImageUri(null);
                setRaw('');
              }}
              style={[styles.primary, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryText}>Scan another</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CaptureBtn({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
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
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  captureRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  captureBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  captureText: { fontWeight: '700', fontSize: 15 },
  preview: { width: '100%', height: 160, borderRadius: 14, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  primary: { marginTop: 22, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700', fontSize: 15 },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 2,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  grade: { fontSize: 24, fontWeight: '800' },
  gradeSub: { fontSize: 13, marginTop: 4 },
  disclaimer: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  ingRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  ingName: { fontSize: 16, fontWeight: '700' },
  ingMeta: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  ingNote: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  ingSource: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
});
