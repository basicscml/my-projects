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
import { useShopping } from '../store/ShoppingContext';
import { RootStackParamList } from '../navigation/types';
import { ProgressRing } from '../components/ProgressRing';
import {
  analyzeIngredients,
  IngredientAnalysis,
  riskColor,
  riskLabel,
  SAMPLE_INGREDIENTS,
} from '../utils/ingredientAnalyzer';
import {
  searchProductsByName,
  ProductResult,
  NutriScore,
  nutriScoreColor,
  novaColor,
  novaLabel,
} from '../utils/openFoodFacts';
import { blendHealth } from '../utils/healthScore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Nutrition = { nova: number | null; nutriScore: NutriScore; brand: string | null };

export function IngredientScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const { setProductHealth } = useShopping();
  const [raw, setRaw] = useState('');
  const [productName, setProductName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<IngredientAnalysis | null>(null);
  const [saved, setSaved] = useState(false);

  // Open Food Facts lookup
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);

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

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const r = await searchProductsByName(q);
      setResults(r);
      if (r.length === 0) setSearchError('No matching products found.');
    } catch {
      setSearchError(
        'Couldn’t reach Open Food Facts. This works on your phone’s network; the preview sandbox blocks external calls.'
      );
    } finally {
      setSearching(false);
    }
  };

  const pickProduct = (p: ProductResult) => {
    setProductName(p.name);
    setNutrition({ nova: p.novaGroup, nutriScore: p.nutriScore, brand: p.brand });
    if (p.ingredientsText) {
      setRaw(p.ingredientsText);
      analyze(p.ingredientsText);
    } else {
      Alert.alert(
        'No ingredient list',
        `${p.name} has no ingredients listed in Open Food Facts, but its Nutri-Score / NOVA are shown.`
      );
    }
  };

  const resetAll = () => {
    setResult(null);
    setImageUri(null);
    setRaw('');
    setProductName('');
    setSaved(false);
    setNutrition(null);
    setResults([]);
    setQuery('');
    setSearchError(null);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? theme.accent : score >= 60 ? '#7BA05B' : score >= 40 ? theme.amber : theme.danger;

  // Blend the additive score with OFF nutrition (Nutri-Score/NOVA) when present.
  const display = result
    ? nutrition
      ? blendHealth(result.score, nutrition.nutriScore, nutrition.nova)
      : { score: result.score, grade: result.grade, basis: ['additives'] }
    : null;

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
              Look up a product in Open Food Facts, or scan/paste the ingredients
              yourself. We check each ingredient against a curated additive-risk
              dataset and add the product’s Nutri-Score / processing level.
            </Text>

            {/* Open Food Facts lookup */}
            <Text style={[styles.label, { color: theme.textMuted, marginTop: 0 }]}>
              LOOK UP A PRODUCT · OPEN FOOD FACTS
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={runSearch}
                returnKeyType="search"
                placeholder="Search by name, e.g. Nutella"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.nameInput,
                  { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
              />
              <Pressable
                onPress={runSearch}
                disabled={searching || !query.trim()}
                style={[styles.searchBtn, { backgroundColor: query.trim() ? theme.primary : theme.border }]}
              >
                <Text style={styles.searchBtnText}>{searching ? '…' : 'Search'}</Text>
              </Pressable>
            </View>
            {searchError && (
              <Text style={[styles.hint, { color: theme.textMuted }]}>{searchError}</Text>
            )}
            {results.map((p) => (
              <Pressable
                key={p.code}
                onPress={() => pickProduct(p)}
                style={[styles.resultRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultName, { color: theme.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.resultSub, { color: theme.textMuted }]} numberOfLines={1}>
                    {[p.brand, p.additiveTags.length ? `${p.additiveTags.length} additives` : null]
                      .filter(Boolean)
                      .join(' · ') || 'tap to analyze'}
                  </Text>
                </View>
                {p.nutriScore && (
                  <Badge text={p.nutriScore.toUpperCase()} color={nutriScoreColor(p.nutriScore)} />
                )}
                {p.novaGroup != null && (
                  <Badge text={`N${p.novaGroup}`} color={novaColor(p.novaGroup)} />
                )}
              </Pressable>
            ))}

            <Text style={[styles.orLine, { color: theme.textMuted }]}>
              — or scan / paste the label yourself —
            </Text>

            <View style={styles.captureRow}>
              <CaptureBtn label="Take photo" icon="📷" onPress={() => pickImage(true)} />
              <CaptureBtn label="Pick photo" icon="🖼️" onPress={() => pickImage(false)} />
            </View>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            )}

            <Text style={[styles.label, { color: theme.textMuted }]}>PRODUCT NAME (OPTIONAL)</Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g. Oat Milk — links the score to this product"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.nameInput,
                { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
            />

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
                { backgroundColor: theme.card, borderColor: scoreColor(display!.score) },
              ]}
            >
              <ProgressRing
                progress={display!.score / 100}
                color={scoreColor(display!.score)}
                size={76}
                label={String(display!.score)}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.grade, { color: scoreColor(display!.score) }]}>
                  {display!.grade}
                </Text>
                <Text style={[styles.gradeSub, { color: theme.textMuted }]}>
                  {result.additiveCount} additive
                  {result.additiveCount === 1 ? '' : 's'} ·{' '}
                  {result.counts.high + result.counts.moderate} to watch
                </Text>
                <Text style={[styles.basis, { color: theme.textMuted }]}>
                  Based on: {display!.basis.join(' · ')}
                </Text>
              </View>
            </View>

            {nutrition && (nutrition.nutriScore || nutrition.nova != null) && (
              <View style={[styles.nutriCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.nutriLabel, { color: theme.textMuted }]}>
                  NUTRITION · OPEN FOOD FACTS
                </Text>
                <View style={styles.nutriRow}>
                  {nutrition.nutriScore && (
                    <View style={styles.nutriItem}>
                      <Badge text={`Nutri ${nutrition.nutriScore.toUpperCase()}`} color={nutriScoreColor(nutrition.nutriScore)} big />
                    </View>
                  )}
                  {nutrition.nova != null && (
                    <View style={styles.nutriItem}>
                      <Badge text={`NOVA ${nutrition.nova}`} color={novaColor(nutrition.nova)} big />
                      <Text style={[styles.nutriSub, { color: theme.textMuted }]}>
                        {novaLabel(nutrition.nova)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {result.petroleumCount > 0 && (
              <View style={[styles.petroBanner, { backgroundColor: theme.cardAlt, borderColor: theme.amber }]}>
                <Text style={[styles.petroText, { color: theme.text }]}>
                  ⛽ {result.petroleumCount} petroleum-derived{' '}
                  {result.petroleumCount === 1 ? 'ingredient' : 'ingredients'} —
                  made from the same crude-oil feedstock as fuels (dyes, TBHQ,
                  BHA/BHT, mineral-oil waxes).
                </Text>
              </View>
            )}

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
                          {info.petroleum ? '  ·  ⛽ petroleum-derived' : ''}
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

            {productName.trim() ? (
              <Pressable
                onPress={() => {
                  setProductHealth(productName, display!.score, display!.grade);
                  setSaved(true);
                }}
                disabled={saved}
                style={[
                  styles.primary,
                  { backgroundColor: saved ? theme.accent : theme.primary },
                ]}
              >
                <Text style={styles.primaryText}>
                  {saved ? `✓ Saved to ${productName.trim()}` : `Save score to “${productName.trim()}”`}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.disclaimer, { color: theme.textMuted, marginTop: 20 }]}>
                Tip: add a product name (above) before scanning to save this
                score against that product — then Compare can weigh its health
                against price.
              </Text>
            )}

            <Pressable onPress={resetAll} style={styles.secondary}>
              <Text style={[styles.secondaryText, { color: theme.textMuted }]}>Scan another</Text>
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

function Badge({ text, color, big }: { text: string; color: string; big?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color, paddingHorizontal: big ? 12 : 8, paddingVertical: big ? 7 : 4 },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: big ? 15 : 12 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultSub: { fontSize: 12, marginTop: 2 },
  orLine: { fontSize: 12, textAlign: 'center', marginTop: 18, marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  badge: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '800' },
  nutriCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  nutriLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  nutriRow: { flexDirection: 'row', gap: 20 },
  nutriItem: { alignItems: 'flex-start', gap: 4 },
  nutriSub: { fontSize: 12 },
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
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
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
  basis: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  petroBanner: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  petroText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
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
