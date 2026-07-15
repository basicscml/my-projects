// ---------------------------------------------------------------------------
// Routines (daily reminders)
// ---------------------------------------------------------------------------

export type Step = {
  id: string;
  text: string;
};

/**
 * A repeatable routine (e.g. "Morning", "Meds", "Wind-down").
 * `days` are weekday indices 0=Sun … 6=Sat that the routine runs on.
 * `time` is "HH:MM" (24h) used for the daily reminder; null means no reminder.
 */
export type Routine = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  days: number[];
  time: string | null;
  reminderEnabled: boolean;
  steps: Step[];
  /** Scheduled OS notification ids so we can cancel/reschedule cleanly. */
  notificationIds: string[];
};

/**
 * Per-day completion record.
 * completions[dateKey][routineId] = list of completed step ids for that day.
 */
export type Completions = {
  [dateKey: string]: {
    [routineId: string]: string[];
  };
};

// ---------------------------------------------------------------------------
// Shopping (stores, list, receipts)
// ---------------------------------------------------------------------------

export type Coord = {
  latitude: number;
  longitude: number;
};

/**
 * A place you shop. If it has a location + geofence, the app can nudge you
 * with your list / restock suggestions when you arrive, and auto-tag receipts.
 */
export type Store = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  location: Coord | null;
  /** Geofence radius in meters. */
  radius: number;
  geofenceEnabled: boolean;
  /** What to do when you arrive. */
  remindList: boolean;
  suggestRestock: boolean;
};

export type ShoppingItem = {
  id: string;
  name: string;
  qty: number;
  checked: boolean;
  /** Optional store this item is meant for. */
  storeId: string | null;
  /** Where the item came from — helps explain suggestions. */
  source: 'manual' | 'suggestion';
};

export type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

/**
 * A parsed (or manually entered) receipt. `storeId` links it to a saved store
 * for spend-by-store; `dateKey` is "YYYY-MM-DD" for time grouping.
 */
export type Receipt = {
  id: string;
  storeName: string;
  storeId: string | null;
  dateKey: string;
  total: number;
  items: ReceiptItem[];
  source: 'parsed' | 'manual';
};
