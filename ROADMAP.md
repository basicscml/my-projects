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

## Recently shipped highlight

**Meds → shopping list crossover** (the "brings it all together" feature): a
routine can carry a refill cycle (e.g. a 30-day meds supply). As the days count
down, when it runs low it surfaces under "Refills due" on the shopping list with
one-tap **Add**; once added the row offers **Mark filled** to reset the cycle.
The routines half now feeds the shopping half — exactly the unifying idea.

## Guiding thesis — a second brain for the boring-but-hard stuff

The app exists to offload the executive-function jobs an ADHD brain finds
expensive. Four "taxes", each paid by a feature:

| ADHD tax | Feature that pays it |
|---|---|
| **Starting** (task paralysis) | one-step runner, tiny first steps, "2-minute" mode |
| **Remembering** (working memory) | list, receipts, **self-stocking pantry**, "did I already buy this?" |
| **Time/context blindness** | geofence + timed nudges, learned shopping days |
| **Deciding** (choice overload) | ingredient scan → one score instead of a wall of text |

**Design laws** (so it doesn't become another abandoned ADHD system):
1. **Self-maintaining.** Feed off things the user already does (scanning
   receipts, walking into stores) — never manual upkeep.
2. **Reduce, don't add.** Every feature removes a decision or a memory.
3. **Externalize state.** Make the invisible (pantry level, time, spend) visible.
4. **Forgiving, never shaming.** Missed days vanish quietly; reward follow-through
   (and restraint), never guilt.

**Open question — one app or two?** Undecided, and deliberately so: the shared
receipt→pantry/spend engine is the same either way. Current lean: **one app,
kept modular**, with the **food-health scanner** as the piece most able to spin
off into its own (mainstream, non-ADHD) app later.

## Shipped (v1 foundation)

- Routines & reminders (daily local notifications, step-by-step runner).
- Shopping list with merge + restock chips.
- **Receipt reader**: text → structured items/store/date/total, editable review,
  saved history. (On-device OCR of the photo is the next drop-in — see below.)
- Spend-by-store summary.
- Stores with location pin + foreground "who's nearby" geofence check.
- Restock suggestions from receipt history.
- **Ingredient scan** (your idea): paste/scan a product's *ingredients list* →
  each ingredient checked against a curated, sourced additive-risk dataset →
  0–100 additive-focused score + per-ingredient flags with the source cited.
  (Photo OCR of the label is the drop-in upgrade; see Phase 3 #6.)
- **Self-stocking pantry** (the "forgetting/running out" tax): learns each
  item's rebuy interval from receipts and predicts when you'll run out — no
  manual inventory. Surfaces "running low" on the list, plus a "did I already
  buy this?" guard when you add something you bought in the last few days.
- **Price intelligence / Compare** (per-oz + cross-store value + health):
  - **Per-oz / per-unit pricing** — parses sizes ("64 fl oz", "1 lb", "12 ct",
    "1/4 lb") and normalizes to $/oz, $/fl oz, or $/each.
  - **Cross-store comparison** — groups the same item across stores, shows where
    it's cheapest per unit and the % you'd save, with full price history.
  - **Health + cost weighing** — attach an ingredient-scan score to a product,
    then a plain-language verdict weighs health against price ("cheaper
    elsewhere, but check the ingredients" / "great value — healthy and cheaper").
  - Sort everything by best savings, cheapest/oz, or healthiest.

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
6. ✅ **On-device photo OCR (built).** The "Take/Pick photo" buttons on both the
   receipt scanner and the ingredient scanner now run **ML Kit text recognition
   on-device** (`src/utils/ocr.ts`, with a `.web.ts` shim), then feed the text
   straight into the parser / analyzer — no typing. On-device, no network.
   Requires a **custom dev/prod build** (not Expo Go / web preview); degrades
   gracefully to paste/barcode elsewhere.
7. **Calendar sync.** Write your predicted shop day / reminders to the phone
   calendar (`expo-calendar`), and read busy days to time nudges (#4).
8. **True background geofencing.** Upgrade the foreground "check nearby" to real
   background geofences (`expo-location` + `expo-task-manager`) so "when you pass
   a store, suggest what you buy" fires on its own.

### 🟠 Phase 4 — food health & deals (external data)

9. **Toxic-ingredient flags + Yuka-style health rating.**
   - ✅ **Done (v1):** the **Ingredient scan** reads the ingredients list itself
     (your approach — works on any package, no barcode needed) and rates it from
     a curated, sourced additive dataset.
   - ✅ **Done (v1 adapter):** **Open Food Facts** integration — the ingredient
     scanner can now *search a product by name* (barcode lookup ready too) and
     pull its ingredients, additives, **Nutri-Score**, and **NOVA** processing
     level, then run the additive analysis on the real ingredients. This is the
     first live "source adapter" from the ingestion strategy — `src/utils/
     openFoodFacts.ts` normalizes OFF into one shape; more sources become more
     adapters. Degrades gracefully offline. (Runs on the device's network; the
     preview sandbox blocks external calls.)
   - **Next:** barcode camera scan as a second way in; fold Nutri-Score + NOVA
     into a single blended score; add CSPI/EWG as further adapters.
   - _Notes:_ unmatched ingredients degrade to "not in dataset", never "safe".
     Scoring stays transparent about its source — no black box.
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
