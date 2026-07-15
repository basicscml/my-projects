# Homebase — Roadmap

A living list of where the app is going. Each idea is tagged by how hard it is to
build **honestly** — some are free wins from data we already capture, some need a
custom dev build, and some depend on outside data we don't control yet.

Legend:
- 🟢 **Now** — buildable on-device from data we already have. No new dependency.
- 🟡 **Dev build** — needs a native module, so it runs in a custom Expo dev/prod
  build (not the simple Expo Go preview).
- 🟠 **External data** — depends on an outside API/dataset. Feasible, but adds
  network, possibly keys/cost, and terms-of-service questions.

---

## Shipped (v1 foundation)

- Routines & reminders (daily local notifications, step-by-step runner).
- Shopping list with merge + restock chips.
- **Receipt reader**: text → structured items/store/date/total, editable review,
  saved history. (On-device OCR of the photo is the next drop-in — see below.)
- Spend-by-store summary.
- Stores with location pin + foreground "who's nearby" geofence check.
- Restock suggestions from receipt history.

---

## Your ideas, sequenced

### 🟢 Phase 2 — free wins from receipt data (no new dependency)

These need nothing but the receipts we already parse. High value, low risk.

1. **Per-unit / per-oz price breakdown.** Parse size/weight out of item names
   ("Garlic 1 lb", "Oat Milk 64 fl oz") and store a normalized `unitPrice`
   ($/oz, $/lb, $/each). Show it on every item.
   - _Needs:_ a units parser (lb/oz/g/kg/ml/L/ct) + a canonical unit per category.
2. **Fair price comparison across sizes.** Your "garlic 1 lb vs the ¼ lb you
   actually bought" case: once everything is per-oz, compare like-for-like and
   flag the cheaper size/store. Built directly on #1.
3. **Inflation beater.** We already keep every item's price over time. Chart the
   price history per staple, compute your personal basket's inflation rate, and
   alert when a regular buy jumps (or when a cheaper size/store beats your usual).
4. **Learn your shopping days.** Analyze receipt dates → detect your typical
   shop day(s) and cadence ("you shop Sundays, ~every 6 days"). Surface a
   heads-up + prep-your-list nudge. (Calendar sync is the 🟡 version below.)

### 🟡 Phase 3 — needs a custom dev build (native modules)

5. **Barcode scan for products.** Add camera barcode scanning (`expo-camera`).
   Scanning a product's barcode is the key that unlocks health data (Phase 4).
6. **On-device receipt OCR.** Replace "paste the text" with real text
   recognition on the photo (ML Kit). The parser and review screen already exist
   — this just feeds them automatically.
7. **Calendar sync.** Write your predicted shop day / reminders to the phone
   calendar (`expo-calendar`), and read busy days to time nudges (#4).
8. **True background geofencing.** Upgrade the foreground "check nearby" to real
   background geofences (`expo-location` + `expo-task-manager`) so "when you pass
   a store, suggest what you buy" fires on its own.

### 🟠 Phase 4 — food health & deals (external data)

9. **Toxic-ingredient flags + Yuka-style health rating.** The honest path:
   **Open Food Facts** — a free, open product database with ingredients,
   additives, allergens, Nutri-Score and NOVA (processing) levels. Scan a
   barcode (#5) → fetch the product → show a health score and flag concerning
   additives/ingredients. (Yuka itself has no public API; Open Food Facts is the
   open equivalent that powers this cleanly, no key required.)
   - _Notes:_ some products won't be in the DB; we degrade to "unknown" honestly.
     Health scoring should be transparent about its source, not a black box.
10. **Weekly circulars / deals.** Pull store weekly ads and match them to your
    list and usual buys. This is the **lowest-confidence** item: there's no clean
    free/official circular API. Options — a data provider (e.g. Flipp-style
    feeds, subject to their terms), official store APIs where they exist, or
    manual/user-imported flyers. Needs a research spike before committing.

---

## Recommended next slice

**Phase 2, items 1 + 3** (per-oz pricing → inflation tracking). They're pure
wins from data we already have, need no permissions or external services, and
make the receipt history immediately more useful. Health ratings (Phase 4 #9 via
Open Food Facts + barcode) is the most exciting external feature and a natural
follow-on once barcode scanning lands.

## Honest constraints to keep in mind

- **On-device only, for now.** Everything is local + offline. Phase 4 introduces
  the first outbound network calls (Open Food Facts); accounts/cloud sync would
  come later if you want cross-device history.
- **Health ratings are guidance, not medical advice.** We'll show the data
  source and let users judge.
- **Circulars need a legit data source.** We won't scrape anything whose terms
  forbid it — this one gets a research spike first.
