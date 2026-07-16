# Food Health & Toxin Data Sources

Research notes for powering the app's ingredient/health + toxin features beyond
the bundled ~35-additive starter set. Prompted by **Healthy Florida First**
(Florida's state food-contaminant testing program, published at
`exposingfoodtoxins.com`).

## The key distinction: two very different kinds of "toxin"

1. **Additives / ingredients** — things put *in* the product by design
   (dyes, preservatives, potassium bromate, sweeteners, E-numbers).
   → **Readable from the ingredients list.** This is what our Ingredient Scan
   does today. Enrich it with the additive databases below.

2. **Contaminants / residues** — things that *shouldn't* be there
   (glyphosate in bread, arsenic/heavy metals in candy, pesticide residue).
   → **NOT readable from an ingredients list.** These require brand/product-level
   *lab testing* data. To surface them we'd match a scanned product (by
   brand/name or barcode) against a testing dataset — a separate data layer from
   the ingredient parser.

This is why Healthy Florida First matters: it's category 2. Our scanner can't
infer glyphosate from "enriched flour" — we'd have to look up the brand.

---

## Category 1 — Additive / ingredient safety ratings

| Source | Coverage | Programmatic access | Notes |
|---|---|---|---|
| **Open Food Facts** | Ingredients, additives (E-numbers), NOVA processing, Nutri-Score, allergens; barcode → product | ✅ Free JSON API + nightly full dumps (JSONL/Parquet), **ODbL open license** | **Best base.** No key, no rate limit for reasonable use. Barcode lookup built in. |
| **CSPI Chemical Cuisine** | Additives rated Safe → Avoid, well-sourced (FDA/EFSA/WHO) | ❌ Web resource, no official API | Great to curate into our local dataset with citations. |
| **Additive Facts** (additivefacts.com) | 3,971 ingredients rated Safe/Caution/Avoid; "banned in EU, legal in US" flags | ❌ Web (aggregates FDA EAFUS, EFSA OpenFoodTox, OpenFDA) | Check reuse terms. |
| **AdditiveChecker** | E-number lookup | ❌ Web | Reference. |
| **EWG Food Scores** | 80k+ foods; nutrition + ingredient concern + processing; some contaminants (mercury, arsenic-in-rice) | ⚠️ No public API — contact for licensing | Uses Label Insight data. |
| **EFSA OpenFoodTox** | Toxicological hazard data for substances | ✅ Downloadable dataset | Deep hazard reference. |
| **WHO JECFA** | Additive/contaminant/flavour evaluations | ✅ Searchable DB | Authoritative safety evaluations. |
| **FDA — Substances Added to Food (EAFUS)** / SCOGS / Food Additive Status List | US regulatory status of additives | ✅ Downloadable | Official US status of record. |
| **EU food additives database** (European Commission) | Approved EU additives + conditions of use | ✅ Web DB | Basis for EU bans (e.g. E171). |
| **openFDA API** | Recalls, enforcement, adverse events | ✅ Free JSON API | Add recall/adverse-event flags. |

## Category 2 — Contaminant / residue testing (brand & product level)

| Source | Coverage | Access | Notes |
|---|---|---|---|
| **Healthy Florida First** (`exposingfoodtoxins.com`) | FL state testing: glyphosate in bread, arsenic/heavy metals in candy, infant formula, potassium bromate | ⚠️ Reports/site; confirm data export + terms | **See caveat below** — methodology criticized. |
| **USDA Pesticide Data Program (PDP)** | Annual pesticide-residue testing across foods | ✅ Downloadable datasets | Gold-standard residue data. |
| **FDA Total Diet Study** | Long-running contaminant + nutrient monitoring | ✅ Downloadable | Broad, methodical. |
| **Consumer Reports** | Heavy-metal investigations (baby food, chocolate, etc.) | ❌ Articles/reports | Cite, don't scrape. |
| **EWG** | Pesticides (Dirty Dozen/Clean Fifteen), tap water | ⚠️ Site; some downloads | Consumer-facing. |

---

## Honest caveat on contaminant data (matters for our credibility)

Healthy Florida First's findings have been **criticized by toxicologists and
food-safety scientists** for missing methodology and risk context:

- Bread **glyphosate** was found at *a tiny fraction* of the EPA limit — reports
  noted it would take ~18,850 slices/day to reach the federal threshold.
- Candy **arsenic** was measured as *total* arsenic (EPA Method 6010D), which
  doesn't separate the more-toxic inorganic form; benchmarks used didn't align
  with federal standards, per the National Confectioners Association.

Design implication (ties to our roadmap's "transparent, not a black box" law):
if we surface contaminant data, we must show **dose/context and the source**,
never a bare scary flag. "Detected" ≠ "dangerous at this serving." A toxin
feature that fear-mongers would be both wrong and untrustworthy.

---

## Recommended integration order

1. **Open Food Facts API** — biggest immediate win. Barcode + additives + NOVA +
   Nutri-Score. Covers far more ingredients than our bundled list and adds the
   *nutrition* half of a Yuka-style score. Clean open license.
2. **Curate CSPI Chemical Cuisine + EFSA/JECFA** classifications into our local
   additive dataset (offline, cited) — keeps the scanner working without network.
3. **Contaminant layer (later):** a brand/product-keyed dataset built from
   **USDA PDP** + **FDA Total Diet Study** (+ Healthy Florida First where terms
   allow), matched by barcode/brand — always shown with dose + source context.

## Ultra-processed food markers (consumer guidance)

Not a database, but useful "avoid" lists to shape the scanner's flags:

- **Mayo Clinic** names these as ingredients to avoid in ultra-processed foods:
  high-fructose corn syrup, hydrogenated oils, food dyes, MSG, sodium
  nitrates/nitrites, and sulfites — plus the heuristic "if you can't pronounce
  it / it's a long chemical name, it's likely ultra-processed." All of these are
  in our dataset.

## Petroleum-derived additives (the "made from the same stuff as fuel" angle)

Many synthetic additives share a **crude-oil feedstock** with fuels. Now flagged
in the app with `petroleum: true` and an ⛽ badge:

- **Artificial dyes** (Red 40, Yellow 5/6, Blue 1, …) — historically "coal-tar",
  now petroleum-based; the **FDA is phasing the major ones out by end of 2027**.
- **TBHQ, BHA, BHT** — petroleum-derived antioxidants in high-fat/fried foods.
- **Mineral oil / paraffin / microcrystalline waxes** (E905) — petroleum;
  MOAH (aromatic hydrocarbon) contamination is an EFSA concern.
- **~85% of synthetic vanillin** comes from guaiacol, a petrochemical precursor.

## Sources

- Open Food Facts — API: https://openfoodfacts.github.io/openfoodfacts-server/api/ · Data: https://world.openfoodfacts.org/data
- CSPI Chemical Cuisine: https://www.cspi.org/page/chemical-cuisine-food-additive-safety-ratings
- Additive Facts: https://additivefacts.com/
- AdditiveChecker: https://www.additivechecker.com/
- EWG Food Scores: https://www.ewg.org/foodscores/
- WHO JECFA: https://apps.who.int/food-additives-contaminants-jecfa-database/
- FDA Substances Added to Food: https://www.fda.gov/food/food-additives-petitions/substances-added-food-formerly-eafus
- FDA Food Additive Status List: https://www.fda.gov/food/food-additives-petitions/food-additive-status-list
- EU additives database: https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en
- Healthy Florida First (bread): https://exposingfoodtoxins.com/bread/ · (candy): https://exposingfoodtoxins.com/candy/
- Mayo Clinic Press — ingredients to avoid in UPFs: https://mcpress.mayoclinic.org/nutrition-fitness/key-ingredients-to-avoid-in-ultra-processed-foods/
- tert-Butylhydroquinone (TBHQ): https://en.wikipedia.org/wiki/Tert-Butylhydroquinone
- EFSA — paraffinic waxes / mineral oil in food contact: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9890528/
- Poynter fact-check (bread glyphosate context): https://www.poynter.org/fact-checking/2026/does-bread-contain-weed-killer/
- Food Safety Magazine (candy arsenic context): https://www.food-safety.com/articles/11116-scientists-say-missing-data-in-florida-reports-on-metals-in-candy-infant-formula-create-confusion
