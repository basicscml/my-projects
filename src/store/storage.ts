import AsyncStorage from '@react-native-async-storage/async-storage';
import { Completions, Receipt, Routine, ShoppingItem, Store } from '../types';

const ROUTINES_KEY = 'homebase.routines.v1';
const COMPLETIONS_KEY = 'homebase.completions.v1';
const STORES_KEY = 'homebase.stores.v1';
const LIST_KEY = 'homebase.list.v1';
const RECEIPTS_KEY = 'homebase.receipts.v1';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Routines --------------------------------------------------------------

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
  return readJSON<Completions>(COMPLETIONS_KEY, {});
}

export async function saveCompletions(c: Completions): Promise<void> {
  await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(c));
}

// Shopping --------------------------------------------------------------

/** null (not []) signals "never initialized" so first launch can seed. */
export async function loadStores(): Promise<Store[] | null> {
  const raw = await AsyncStorage.getItem(STORES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Store[];
  } catch {
    return null;
  }
}

export async function saveStores(stores: Store[]): Promise<void> {
  await AsyncStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export async function loadList(): Promise<ShoppingItem[]> {
  return readJSON<ShoppingItem[]>(LIST_KEY, []);
}

export async function saveList(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(items));
}

export async function loadReceipts(): Promise<Receipt[]> {
  return readJSON<Receipt[]>(RECEIPTS_KEY, []);
}

export async function saveReceipts(receipts: Receipt[]): Promise<void> {
  await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}
