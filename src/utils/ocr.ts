import { Platform } from 'react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export type OcrResult = { text: string } | { error: string };

/** On-device text recognition is available on iOS/Android (dev/prod builds). */
export function ocrSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Read text from a photo using on-device ML Kit — no network, nothing leaves the
 * phone. Returns the recognized text, or a friendly error to fall back on
 * (paste / barcode / product search).
 */
export async function recognizeText(uri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(uri);
    const text = (result?.text ?? '').replace(/\s+\n/g, '\n').trim();
    if (!text) return { error: 'No readable text found. Try a clearer, well-lit photo.' };
    return { text };
  } catch {
    return {
      error:
        'On-device reading needs the dev/production build (not Expo Go). You can paste the text or scan the barcode instead.',
    };
  }
}
