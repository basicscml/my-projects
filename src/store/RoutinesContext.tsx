import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Completions, Routine } from '../types';
import {
  loadCompletions,
  loadRoutines,
  saveCompletions,
  saveRoutines,
} from './storage';
import { seedRoutines } from './seed';
import { cancelRoutine, rescheduleRoutine } from '../utils/notifications';
import { dateKey } from '../utils/dates';

type Ctx = {
  ready: boolean;
  routines: Routine[];
  completions: Completions;
  /** Routines scheduled to run on the given weekday (default today). */
  routinesForDay: (weekday: number) => Routine[];
  getRoutine: (id: string) => Routine | undefined;
  upsertRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  toggleStep: (routineId: string, stepId: string, day?: string) => void;
  completedSteps: (routineId: string, day?: string) => string[];
  resetRoutineForToday: (routineId: string) => void;
  /** Reset a consumable routine's refill cycle to "filled today". */
  markRefilled: (routineId: string) => void;
};

const RoutinesContext = createContext<Ctx | null>(null);

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const completionsRef = useRef(completions);
  completionsRef.current = completions;

  // Initial load (or seed on first launch).
  useEffect(() => {
    (async () => {
      try {
        const [loadedRoutines, loadedCompletions] = await Promise.all([
          loadRoutines(),
          loadCompletions(),
        ]);
        if (loadedRoutines) {
          setRoutines(loadedRoutines);
        } else {
          const seeded = seedRoutines();
          // Schedule reminders for any seeded routines that want them.
          for (const r of seeded) {
            r.notificationIds = await rescheduleRoutine(r);
          }
          setRoutines(seeded);
          await saveRoutines(seeded);
        }
        setCompletions(loadedCompletions);
      } catch (e) {
        // Never let a storage/native failure wedge the app at the loading state.
        console.warn('Routines init failed', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistRoutines = useCallback(async (next: Routine[]) => {
    setRoutines(next);
    await saveRoutines(next);
  }, []);

  const persistCompletions = useCallback(async (next: Completions) => {
    setCompletions(next);
    await saveCompletions(next);
  }, []);

  const routinesForDay = useCallback(
    (weekday: number) => routines.filter((r) => r.days.includes(weekday)),
    [routines]
  );

  const getRoutine = useCallback(
    (id: string) => routines.find((r) => r.id === id),
    [routines]
  );

  const upsertRoutine = useCallback(
    async (routine: Routine) => {
      const notificationIds = await rescheduleRoutine(routine);
      const withIds = { ...routine, notificationIds };
      const exists = routines.some((r) => r.id === routine.id);
      const next = exists
        ? routines.map((r) => (r.id === routine.id ? withIds : r))
        : [...routines, withIds];
      await persistRoutines(next);
    },
    [routines, persistRoutines]
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      const target = routines.find((r) => r.id === id);
      if (target) await cancelRoutine(target);
      await persistRoutines(routines.filter((r) => r.id !== id));
    },
    [routines, persistRoutines]
  );

  const completedSteps = useCallback(
    (routineId: string, day: string = dateKey()) =>
      completions[day]?.[routineId] ?? [],
    [completions]
  );

  const toggleStep = useCallback(
    (routineId: string, stepId: string, day: string = dateKey()) => {
      const current = completionsRef.current;
      const forDay = current[day] ?? {};
      const done = new Set(forDay[routineId] ?? []);
      if (done.has(stepId)) done.delete(stepId);
      else done.add(stepId);
      const next: Completions = {
        ...current,
        [day]: { ...forDay, [routineId]: Array.from(done) },
      };
      persistCompletions(next);
    },
    [persistCompletions]
  );

  const markRefilled = useCallback(
    (routineId: string) => {
      const next = routines.map((r) =>
        r.id === routineId && r.restock
          ? { ...r, restock: { ...r.restock, lastFilledKey: dateKey() } }
          : r
      );
      persistRoutines(next);
    },
    [routines, persistRoutines]
  );

  const resetRoutineForToday = useCallback(
    (routineId: string) => {
      const day = dateKey();
      const current = completionsRef.current;
      const forDay = { ...(current[day] ?? {}) };
      forDay[routineId] = [];
      persistCompletions({ ...current, [day]: forDay });
    },
    [persistCompletions]
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      routines,
      completions,
      routinesForDay,
      getRoutine,
      upsertRoutine,
      deleteRoutine,
      toggleStep,
      completedSteps,
      resetRoutineForToday,
      markRefilled,
    }),
    [
      ready,
      routines,
      completions,
      routinesForDay,
      getRoutine,
      upsertRoutine,
      deleteRoutine,
      toggleStep,
      completedSteps,
      resetRoutineForToday,
      markRefilled,
    ]
  );

  return (
    <RoutinesContext.Provider value={value}>
      {children}
    </RoutinesContext.Provider>
  );
}

export function useRoutines(): Ctx {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be used within RoutinesProvider');
  return ctx;
}
