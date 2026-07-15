# Homebase

A calm personal app for **daily routines + food shopping**, built with React Native + Expo (iOS & Android, from one codebase). Everything is stored **on-device** and works offline — no accounts, no setup.

Two sides, one shared reminder/geofence engine:

## 🗓 Routines & reminders
- **Today** — the routines scheduled for today, each with a progress ring.
- **Runner** — one step at a time with a big check-off button (easy to start, hard to freeze on).
- **Routines** — create/edit routines: name, emoji, color, repeat days, reminder time, steps.
- A daily local notification at the time you choose, only on the days a routine runs.

## 🛒 Food shopping
- **Shopping list** — quick add, merge duplicates, check off, restock chips from your history.
- **Receipt reader** — turn a receipt's text into structured items + store + date + total, review/edit, and save it. (On-device photo OCR is the next drop-in — see the roadmap.)
- **Receipts** — history + spend-by-store summary.
- **Stores** — pin a store's location and geofence it. A foreground "who's nearby?" check nudges you with your list + restock picks when you arrive.

See **[ROADMAP.md](./ROADMAP.md)** for what's next — per-oz price comparison, an
inflation tracker built from your own receipts, barcode-based food health
ratings (via Open Food Facts), calendar sync, weekly circulars, and more.

## Running it

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with **Expo Go**.

> Local notifications, image picking, and foreground location work in Expo Go.
> Background geofencing and on-device OCR need a custom dev build
> (`npx eas build`) — see the roadmap.

## Project layout

```
App.tsx                     Providers (Routines + Shopping) + navigation
index.ts                    Expo root registration
src/
  types.ts                  Routine / Store / ShoppingItem / Receipt models
  theme.ts                  Light + dark palette
  store/
    RoutinesContext.tsx     Routines state + persistence + scheduling
    ShoppingContext.tsx     Stores / list / receipts + geofence check
    storage.ts              AsyncStorage read/write
    seed.ts                 Starter data + sample receipt
  utils/
    receiptParser.ts        Text → structured receipt (the "reader")
    suggestions.ts          Restock suggestions + spend-by-store
    location.ts             Foreground location + arrival notifications
    geo.ts / dates.ts / money.ts / id.ts / notifications.ts
  navigation/               Tabs (Today · List · Receipts · Routines) + stack
  components/               ProgressRing, DayPicker, TimePicker
  screens/                  Today, List, Receipts, ScanReceipt, ReceiptDetail,
                            Stores, StoreEditor, Routines, RoutineEditor, Runner
```

## Data & privacy

All data lives on the device via `AsyncStorage`. Nothing leaves your phone in v1.
The first outbound calls arrive in Phase 4 (food health lookups) — opt-in, with
the data source shown.
