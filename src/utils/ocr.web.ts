// Web has no on-device OCR — this shim keeps the native ML Kit module out of the
// web bundle. Metro picks this file for web; ocr.ts is used on iOS/Android.
export type OcrResult = { text: string } | { error: string };

export function ocrSupported(): boolean {
  return false;
}

export async function recognizeText(_uri: string): Promise<OcrResult> {
  return { error: 'Photo reading runs in the iOS/Android app, not the web preview.' };
}
