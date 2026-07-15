/**
 * Starter additive / ingredient risk dataset for the Ingredient Scan feature.
 *
 * IMPORTANT — this is *guidance*, not medical advice, and it is a curated
 * starter set, not a complete or authoritative database. Risk levels summarize
 * commonly cited public assessments (EFSA, IARC, the UK "Southampton six"
 * study, FDA/EFSA additive reviews). They are deliberately conservative and
 * should be reviewed/expanded. Where the science is debated we say so.
 *
 * A production version should enrich this from an open source such as
 * Open Food Facts' additives taxonomy rather than relying on this list alone.
 */

export type IngredientRisk = 'safe' | 'limited' | 'moderate' | 'high';

export type AdditiveInfo = {
  /** Lowercased E-number codes, e.g. "e621". Optional for non-additive concerns. */
  codes: string[];
  name: string;
  /** Extra lowercased names/synonyms to match in free text. */
  synonyms: string[];
  category: string;
  risk: IngredientRisk;
  note: string;
  source: string;
};

export const ADDITIVES: AdditiveInfo[] = [
  // --- Colorants: the "Southampton six" (EU hyperactivity warning) ---
  {
    codes: ['e102'],
    name: 'Tartrazine (Yellow 5)',
    synonyms: ['tartrazine', 'yellow 5', 'fd&c yellow 5'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Azo dye linked to hyperactivity in some children; EU requires a warning label.',
    source: 'EFSA / UK Southampton study (2007)',
  },
  {
    codes: ['e104'],
    name: 'Quinoline Yellow',
    synonyms: ['quinoline yellow'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'One of the "Southampton six" colors tied to activity/attention effects.',
    source: 'UK Southampton study (2007)',
  },
  {
    codes: ['e110'],
    name: 'Sunset Yellow (Yellow 6)',
    synonyms: ['sunset yellow', 'yellow 6', 'fd&c yellow 6'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Azo dye with hyperactivity concerns; EU warning label required.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e122'],
    name: 'Carmoisine (Azorubine)',
    synonyms: ['carmoisine', 'azorubine'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Azo dye; hyperactivity concerns; restricted/warning-labelled in EU.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e124'],
    name: 'Ponceau 4R',
    synonyms: ['ponceau 4r', 'cochineal red a'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Azo dye; hyperactivity concerns; EU warning label required.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e129'],
    name: 'Allura Red (Red 40)',
    synonyms: ['allura red', 'red 40', 'fd&c red 40'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Common azo dye; hyperactivity concerns; EU warning label required.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e133'],
    name: 'Brilliant Blue (Blue 1)',
    synonyms: ['brilliant blue', 'blue 1', 'fd&c blue 1'],
    category: 'Colorant',
    risk: 'limited',
    note: 'Synthetic dye; generally low concern at typical intakes.',
    source: 'EFSA additive review',
  },

  // --- Pigments / whiteners ---
  {
    codes: ['e171'],
    name: 'Titanium Dioxide',
    synonyms: ['titanium dioxide'],
    category: 'Colorant',
    risk: 'high',
    note: 'EFSA (2021) concluded it can no longer be considered safe as a food additive; banned in the EU.',
    source: 'EFSA (2021), EU ban (2022)',
  },

  // --- Preservatives ---
  {
    codes: ['e211'],
    name: 'Sodium Benzoate',
    synonyms: ['sodium benzoate'],
    category: 'Preservative',
    risk: 'moderate',
    note: 'Can form trace benzene with vitamin C; also part of hyperactivity study mixtures.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e220', 'e221', 'e222', 'e223', 'e224'],
    name: 'Sulphites',
    synonyms: ['sulphur dioxide', 'sulfur dioxide', 'sodium sulphite', 'sulphite', 'sulfite'],
    category: 'Preservative',
    risk: 'moderate',
    note: 'Common allergen; can trigger asthma/sensitivity reactions. Must be declared.',
    source: 'EFSA; EU allergen labelling',
  },
  {
    codes: ['e249', 'e250'],
    name: 'Nitrites (sodium/potassium)',
    synonyms: ['sodium nitrite', 'potassium nitrite', 'nitrite'],
    category: 'Preservative',
    risk: 'high',
    note: 'Used in cured meats; can form nitrosamines. Processed meat is IARC Group 1 (carcinogenic to humans).',
    source: 'IARC (2015); EFSA',
  },
  {
    codes: ['e251', 'e252'],
    name: 'Nitrates (sodium/potassium)',
    synonyms: ['sodium nitrate', 'potassium nitrate', 'nitrate'],
    category: 'Preservative',
    risk: 'moderate',
    note: 'Can convert to nitrites; linked to processed-meat risks.',
    source: 'IARC (2015); EFSA',
  },
  {
    codes: ['e202'],
    name: 'Potassium Sorbate',
    synonyms: ['potassium sorbate'],
    category: 'Preservative',
    risk: 'limited',
    note: 'Widely used; generally low concern.',
    source: 'EFSA additive review',
  },

  // --- Antioxidants ---
  {
    codes: ['e320'],
    name: 'BHA',
    synonyms: ['butylated hydroxyanisole', 'bha'],
    category: 'Antioxidant',
    risk: 'high',
    note: 'IARC classifies BHA as possibly carcinogenic to humans (Group 2B).',
    source: 'IARC (Group 2B)',
  },
  {
    codes: ['e321'],
    name: 'BHT',
    synonyms: ['butylated hydroxytoluene', 'bht'],
    category: 'Antioxidant',
    risk: 'moderate',
    note: 'Related synthetic antioxidant; mixed evidence, some safety questions.',
    source: 'EFSA additive review',
  },

  // --- Sweeteners ---
  {
    codes: ['e951'],
    name: 'Aspartame',
    synonyms: ['aspartame'],
    category: 'Sweetener',
    risk: 'moderate',
    note: 'IARC (2023) classified as possibly carcinogenic (Group 2B); JECFA kept the existing acceptable daily intake.',
    source: 'IARC / JECFA (2023)',
  },
  {
    codes: ['e950'],
    name: 'Acesulfame K',
    synonyms: ['acesulfame', 'acesulfame potassium', 'ace-k'],
    category: 'Sweetener',
    risk: 'limited',
    note: 'Approved; some call for more long-term data.',
    source: 'EFSA additive review',
  },
  {
    codes: ['e955'],
    name: 'Sucralose',
    synonyms: ['sucralose'],
    category: 'Sweetener',
    risk: 'limited',
    note: 'Approved; debated effects on gut/glucose at high intake.',
    source: 'EFSA additive review',
  },
  {
    codes: ['e954'],
    name: 'Saccharin',
    synonyms: ['saccharin'],
    category: 'Sweetener',
    risk: 'limited',
    note: 'Older sweetener; historical concerns not upheld in humans.',
    source: 'EFSA additive review',
  },

  // --- Flavour enhancers / thickeners ---
  {
    codes: ['e621'],
    name: 'Monosodium Glutamate (MSG)',
    synonyms: ['monosodium glutamate', 'msg'],
    category: 'Flavour enhancer',
    risk: 'limited',
    note: 'Generally recognized as safe; a minority report sensitivity symptoms.',
    source: 'FDA / EFSA',
  },
  {
    codes: ['e407'],
    name: 'Carrageenan',
    synonyms: ['carrageenan'],
    category: 'Thickener',
    risk: 'moderate',
    note: 'Debated; some studies suggest digestive inflammation, especially degraded forms.',
    source: 'EFSA (2018) re-evaluation',
  },

  // --- Non-additive ingredient concerns ---
  {
    codes: [],
    name: 'Partially Hydrogenated Oil (trans fat)',
    synonyms: ['partially hydrogenated', 'hydrogenated oil', 'trans fat'],
    category: 'Fat',
    risk: 'high',
    note: 'Industrial trans fat raises cardiovascular risk; WHO urges elimination.',
    source: 'WHO; FDA (removed GRAS status)',
  },
  {
    codes: [],
    name: 'High-Fructose Corn Syrup',
    synonyms: ['high fructose corn syrup', 'high-fructose corn syrup', 'glucose-fructose syrup', 'hfcs'],
    category: 'Added sugar',
    risk: 'moderate',
    note: 'Added sugar; high intake linked to metabolic risk.',
    source: 'Dietary guidance (WHO/FDA)',
  },
  {
    codes: [],
    name: 'Palm Oil',
    synonyms: ['palm oil', 'palm kernel oil'],
    category: 'Fat',
    risk: 'limited',
    note: 'High in saturated fat; also raises sustainability concerns.',
    source: 'Dietary guidance',
  },

  // --- Commonly-safe reference entries (so scans aren't all red) ---
  {
    codes: ['e300'],
    name: 'Ascorbic Acid (Vitamin C)',
    synonyms: ['ascorbic acid', 'vitamin c'],
    category: 'Antioxidant',
    risk: 'safe',
    note: 'Vitamin C; used as an antioxidant. No concern.',
    source: 'EFSA',
  },
  {
    codes: ['e330'],
    name: 'Citric Acid',
    synonyms: ['citric acid'],
    category: 'Acidity regulator',
    risk: 'safe',
    note: 'Naturally occurring acid; widely regarded as safe.',
    source: 'EFSA',
  },
  {
    codes: ['e322'],
    name: 'Lecithin',
    synonyms: ['lecithin', 'soy lecithin', 'sunflower lecithin'],
    category: 'Emulsifier',
    risk: 'safe',
    note: 'Common emulsifier; no significant concern.',
    source: 'EFSA',
  },
  {
    codes: ['e415'],
    name: 'Xanthan Gum',
    synonyms: ['xanthan gum'],
    category: 'Thickener',
    risk: 'safe',
    note: 'Fermentation-derived thickener; well tolerated.',
    source: 'EFSA',
  },
  {
    codes: ['e440'],
    name: 'Pectin',
    synonyms: ['pectin'],
    category: 'Thickener',
    risk: 'safe',
    note: 'Fruit-derived gelling agent; no concern.',
    source: 'EFSA',
  },
];
