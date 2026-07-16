import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'];

export function BarcodeScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const [manual, setManual] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Scan barcode' });
  }, [navigation]);

  // Send a barcode back to the Ingredient Scan screen, which runs the lookup.
  const submit = (code: string) => {
    const clean = code.replace(/\D/g, '');
    if (!clean || handled) return;
    setHandled(true);
    navigation.navigate('IngredientScan', { barcode: clean });
  };

  const cameraReady = Platform.OS !== 'web' && permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {cameraReady ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES as any }}
            onBarcodeScanned={handled ? undefined : (r) => submit(r.data)}
          />
          <View style={styles.reticle} pointerEvents="none">
            <View style={[styles.frame, { borderColor: theme.primary }]} />
            <Text style={styles.reticleText}>Point at a product barcode</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.center, { padding: 24 }]}>
          <Text style={styles.bigEmoji}>📷</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {Platform.OS === 'web'
              ? 'Camera scanning needs the phone app'
              : 'Camera access needed'}
          </Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            {Platform.OS === 'web'
              ? 'Live barcode scanning runs in the iOS/Android app. You can enter a barcode by hand below.'
              : 'Allow the camera to scan a product barcode, or type it in below.'}
          </Text>
          {Platform.OS !== 'web' && !permission?.granted && (
            <Pressable
              onPress={requestPermission}
              style={[styles.primary, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryText}>Allow camera</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Manual entry — always available, and the only path when no camera. */}
      <View style={[styles.manualBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.manualLabel, { color: theme.textMuted }]}>ENTER A BARCODE</Text>
        <View style={styles.manualRow}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            onSubmitEditing={() => submit(manual)}
            keyboardType="number-pad"
            returnKeyType="go"
            placeholder="e.g. 3017620422003"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
            ]}
          />
          <Pressable
            onPress={() => submit(manual)}
            disabled={!manual.replace(/\D/g, '')}
            style={[styles.lookupBtn, { backgroundColor: manual.replace(/\D/g, '') ? theme.primary : theme.border }]}
          >
            <Text style={styles.lookupText}>Look up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  reticle: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 150, borderWidth: 3, borderRadius: 16 },
  reticleText: { color: '#fff', marginTop: 16, fontWeight: '700', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  primary: { marginTop: 20, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  manualBar: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 14 },
  manualLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  lookupBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lookupText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
