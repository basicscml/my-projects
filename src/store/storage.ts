import AsyncStorage from '@react-native-async-storage/async-storage';
import { Completions, Routine } from '../types';

const ROUTINES_KEY = 'focusflow.routines.v1';
const COMPLETIONS_KEY = 'focusflow.completions.v1';

export async function loadRoutines(): Promise<Routine[] | null> {
  const raw = await AsyncStorage.getItem(ROUTINES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Routine[];
  } catch {
    return null;
  }
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export async function loadCompletions(): Promise<Completions> {
  const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Completions;
  } catch {
    return {};
  }
}

export async function saveCompletions(c: Completions): Promise<void> {
  await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(c));
}
