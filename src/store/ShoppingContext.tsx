import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ProductHealth, Receipt, ShoppingItem, Store } from '../types';
import {
  loadList,
  loadProductHealth,
  loadReceipts,
  loadStores,
  saveList,
  saveProductHealth,
  saveReceipts,
  saveStores,
} from './storage';
import { seedList, seedReceipts, seedStores } from './seed';
import { uid } from '../utils/id';
import { dateKey } from '../utils/dates';
import { getCurrentCoord, nearbyStores, notifyArrival, NearbyHit } from '../utils/location';
import { usualItemsAtStore } from '../utils/suggestions';

type Ctx = {
  ready: boolean;
  stores: Store[];
  list: ShoppingItem[];
  receipts: Receipt[];

  // list
  addItem: (name: string, qty?: number, storeId?: string | null) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearChecked: () => void;
  activeCount: number;

  // stores
  getStore: (id: string) => Store | undefined;
  upsertStore: (store: Store) => void;
  deleteStore: (id: string) => void;

  // receipts
  addReceipt: (receipt: Receipt) => void;
  deleteReceipt: (id: string) => void;

  // product health (from the ingredient scanner)
  productHealth: ProductHealth;
  setProductHealth: (name: string, score: number, grade: string) => void;

  // geofence (foreground)
  checkNearby: () => Promise<NearbyHit[]>;
};

const ShoppingContext = createContext<Ctx | null>(null);

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [list, setList] = useState<ShoppingItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [productHealth, setProductHealthState] = useState<ProductHealth>({});

  useEffect(() => {
    (async () => {
      const [loadedStores, loadedList, loadedReceipts, loadedHealth] = await Promise.all([
        loadStores(),
        loadList(),
        loadReceipts(),
        loadProductHealth(),
      ]);
      setProductHealthState(loadedHealth);

      if (loadedStores) {
        setStores(loadedStores);
        setList(loadedList);
        setReceipts(loadedReceipts);
      } else {
        // First launch: seed stores, list, and a couple of sample receipts.
        const s = seedStores();
        const l = seedList();
        const today = new Date();
        const older = new Date(today);
        older.setDate(older.getDate() - 6);
        const priorWeek = new Date(today);
        priorWeek.setDate(priorWeek.getDate() - 15);
        const r = seedReceipts(dateKey(today), dateKey(older), dateKey(priorWeek));
        setStores(s);
        setList(l);
        setReceipts(r);
        await Promise.all([saveStores(s), saveList(l), saveReceipts(r)]);
      }
      setReady(true);
    })();
  }, []);

  const persistStores = useCallback(async (next: Store[]) => {
    setStores(next);
    await saveStores(next);
  }, []);
  const persistList = useCallback(async (next: ShoppingItem[]) => {
    setList(next);
    await saveList(next);
  }, []);
  const persistReceipts = useCallback(async (next: Receipt[]) => {
    setReceipts(next);
    await saveReceipts(next);
  }, []);

  const addItem = useCallback(
    (name: string, qty = 1, storeId: string | null = null) => {
      const clean = name.trim();
      if (!clean) return;
      setList((prev) => {
        // Merge with an existing unchecked item of the same name.
        const existing = prev.find(
          (i) => !i.checked && i.name.toLowerCase() === clean.toLowerCase()
        );
        const next = existing
          ? prev.map((i) =>
              i.id === existing.id ? { ...i, qty: i.qty + qty } : i
            )
          : [
              {
                id: uid(),
                name: clean,
                qty,
                checked: false,
                storeId,
                source: 'manual' as const,
              },
              ...prev,
            ];
        saveList(next);
        return next;
      });
    },
    []
  );

  const toggleItem = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i
      );
      saveList(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveList(next);
      return next;
    });
  }, []);

  const clearChecked = useCallback(() => {
    setList((prev) => {
      const next = prev.filter((i) => !i.checked);
      saveList(next);
      return next;
    });
  }, []);

  const getStore = useCallback(
    (id: string) => stores.find((s) => s.id === id),
    [stores]
  );

  const upsertStore = useCallback(
    (store: Store) => {
      const exists = stores.some((s) => s.id === store.id);
      const next = exists
        ? stores.map((s) => (s.id === store.id ? store : s))
        : [...stores, store];
      persistStores(next);
    },
    [stores, persistStores]
  );

  const deleteStore = useCallback(
    (id: string) => persistStores(stores.filter((s) => s.id !== id)),
    [stores, persistStores]
  );

  const setProductHealth = useCallback(
    (name: string, score: number, grade: string) => {
      const key = name.toLowerCase().trim();
      if (!key) return;
      setProductHealthState((prev) => {
        const next: ProductHealth = {
          ...prev,
          [key]: { score, grade, dateKey: dateKey() },
        };
        saveProductHealth(next);
        return next;
      });
    },
    []
  );

  const addReceipt = useCallback(
    (receipt: Receipt) => persistReceipts([receipt, ...receipts]),
    [receipts, persistReceipts]
  );

  const deleteReceipt = useCallback(
    (id: string) => persistReceipts(receipts.filter((r) => r.id !== id)),
    [receipts, persistReceipts]
  );

  const activeCount = useMemo(
    () => list.filter((i) => !i.checked).length,
    [list]
  );

  const checkNearby = useCallback(async () => {
    const coord = await getCurrentCoord();
    if (!coord) return [];
    const hits = nearbyStores(coord, stores);
    for (const hit of hits) {
      const usual = usualItemsAtStore(receipts, hit.store);
      await notifyArrival(hit.store, activeCount, usual);
    }
    return hits;
  }, [stores, activeCount, receipts]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      stores,
      list,
      receipts,
      addItem,
      toggleItem,
      removeItem,
      clearChecked,
      activeCount,
      getStore,
      upsertStore,
      deleteStore,
      addReceipt,
      deleteReceipt,
      productHealth,
      setProductHealth,
      checkNearby,
    }),
    [
      ready,
      stores,
      list,
      receipts,
      addItem,
      toggleItem,
      removeItem,
      clearChecked,
      activeCount,
      getStore,
      upsertStore,
      deleteStore,
      addReceipt,
      deleteReceipt,
      productHealth,
      setProductHealth,
      checkNearby,
    ]
  );

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping(): Ctx {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping must be used within ShoppingProvider');
  return ctx;
}
