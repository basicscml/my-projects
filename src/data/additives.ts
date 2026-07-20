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
  /** How it affects the body — concrete, documented effects (organs, mechanisms). */
  effects?: string;
  /** Derived from petroleum / crude-oil feedstock (same source as fuels). */
  petroleum?: boolean;
};

export const ADDITIVES: AdditiveInfo[] = [
  // --- Colorants: the "Southampton six" (EU hyperactivity warning) ---
  {
    codes: ['e102'],
    name: 'Tartrazine (Yellow 5)',
    synonyms: ['tartrazine', 'yellow 5', 'fd&c yellow 5'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Petroleum-derived azo dye (formerly coal-tar); linked to hyperactivity in some children. EU requires a warning label; FDA is phasing petroleum dyes out by end of 2027.',
    effects: 'Can worsen hyperactivity/attention in sensitive children; triggers hives or asthma-like reactions in a small number of people. Purely cosmetic — adds no nutrition.',
    source: 'EFSA / UK Southampton study (2007); FDA',
    petroleum: true,
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
    note: 'Petroleum-derived azo dye (formerly coal-tar); hyperactivity concerns; EU warning label required; FDA phasing out by end of 2027.',
    effects: 'The most-used US dye. Linked to worsened hyperactivity/attention in some children and allergic-type reactions in a few people; cosmetic only.',
    source: 'EFSA / Southampton study; FDA',
    petroleum: true,
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
    effects: 'Nanoparticles may build up in the body; EFSA could not rule out genotoxicity (DNA damage), and studies suggest gut-lining irritation and inflammation.',
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
    effects: 'With vitamin C (ascorbic acid) it can form benzene, a known carcinogen; also tied to worsened hyperactivity/attention in sensitive children.',
    source: 'EFSA / Southampton study',
  },
  {
    codes: ['e220', 'e221', 'e222', 'e223', 'e224'],
    name: 'Sulphites',
    synonyms: ['sulphur dioxide', 'sulfur dioxide', 'sodium sulphite', 'sulphite', 'sulfite'],
    category: 'Preservative',
    risk: 'moderate',
    note: 'Common allergen; can trigger asthma/sensitivity reactions. Must be declared.',
    effects: 'Can trigger asthma attacks, wheezing, hives, or flushing in sulphite-sensitive people (especially some asthmatics); destroys some vitamin B1.',
    source: 'EFSA; EU allergen labelling',
  },
  {
    codes: ['e249', 'e250'],
    name: 'Nitrites (sodium/potassium)',
    synonyms: ['sodium nitrite', 'potassium nitrite', 'nitrite'],
    category: 'Preservative',
    risk: 'high',
    note: 'Used in cured meats; can form nitrosamines. Processed meat is IARC Group 1 (carcinogenic to humans).',
    effects: 'Under heat/stomach acid can form nitrosamines that damage DNA; regular processed-meat intake raises colorectal (bowel) cancer risk.',
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
    note: 'Petroleum-derived antioxidant. IARC classifies BHA as possibly carcinogenic to humans (Group 2B).',
    effects: 'Caused stomach/forestomach tumours in animal studies; acts as an endocrine (hormone) disruptor. Concern is with long-term, repeated exposure.',
    source: 'IARC (Group 2B)',
    petroleum: true,
  },
  {
    codes: ['e321'],
    name: 'BHT',
    synonyms: ['butylated hydroxytoluene', 'bht'],
    category: 'Antioxidant',
    risk: 'moderate',
    note: 'Petroleum-derived synthetic antioxidant; mixed evidence, some safety questions.',
    effects: 'High doses affected the liver, kidneys, and thyroid in animal studies and showed hormone-disrupting activity; human evidence is limited.',
    source: 'EFSA additive review',
    petroleum: true,
  },
  {
    codes: ['e319'],
    name: 'TBHQ',
    synonyms: ['tert-butylhydroquinone', 'tbhq', 'tertiary butylhydroquinone'],
    category: 'Antioxidant',
    risk: 'moderate',
    note: 'Petroleum-derived antioxidant in fried/frozen/high-fat foods (chips, crackers).',
    effects: 'High doses enlarged the liver and affected the kidneys in animals; research links it to weakened immune response and, in lab studies, effects on nerve cells.',
    source: 'EFSA / FDA; toxicology reviews',
    petroleum: true,
  },
  {
    codes: ['e905', 'e905a', 'e905b', 'e905c'],
    name: 'Mineral Oil / Paraffin Wax',
    synonyms: ['mineral oil', 'paraffin', 'microcrystalline wax', 'petrolatum', 'petroleum jelly', 'white mineral oil'],
    category: 'Glazing agent',
    risk: 'moderate',
    note: 'Petroleum-derived. Food-grade grades are refined, but mineral-oil aromatic hydrocarbons (MOAH) are a contamination concern EFSA has flagged.',
    source: 'EFSA (MOSH/MOAH opinions)',
    petroleum: true,
  },

  // --- Sweeteners ---
  {
    codes: ['e951'],
    name: 'Aspartame',
    synonyms: ['aspartame'],
    category: 'Sweetener',
    risk: 'moderate',
    note: 'IARC (2023) classified as possibly carcinogenic (Group 2B); JECFA kept the existing acceptable daily intake.',
    effects: 'Possible cancer link is under debate; some people get headaches. People with the genetic condition PKU must avoid it entirely (it contains phenylalanine).',
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
    effects: 'Most people are unaffected. Some report short-lived headache, flushing, or sweating ("MSG symptom complex") after large amounts; not consistently reproduced in trials.',
    source: 'FDA / EFSA',
  },
  {
    codes: ['e407'],
    name: 'Carrageenan',
    synonyms: ['carrageenan'],
    category: 'Thickener',
    risk: 'moderate',
    note: 'Debated; some studies suggest digestive inflammation, especially degraded forms.',
    effects: 'Lab and animal studies link it to gut-lining inflammation and irritation; some people with IBS/colitis report flare-ups. Human evidence is still debated.',
    source: 'EFSA (2018) re-evaluation',
  },

  // --- Non-additive ingredient concerns ---
  {
    codes: [],
    name: 'Partially Hydrogenated Oil (trans fat)',
    synonyms: ['partially hydrogenated', 'hydrogenated oil', 'hydrogenated', 'trans fat'],
    category: 'Fat',
    risk: 'high',
    note: 'Industrial trans fat. The single most harmful common ingredient — WHO wants it eliminated from the food supply.',
    effects: 'Raises LDL ("bad") cholesterol and lowers HDL ("good"), drives artery-clogging plaque and chronic inflammation, and raises heart-attack, stroke, and type-2 diabetes risk. No safe level.',
    source: 'WHO; FDA (removed GRAS status)',
  },
  {
    codes: [],
    name: 'High-Fructose Corn Syrup',
    synonyms: ['high fructose corn syrup', 'high-fructose corn syrup', 'glucose-fructose syrup', 'hfcs'],
    category: 'Added sugar',
    risk: 'moderate',
    note: 'Added sugar; high intake linked to metabolic risk.',
    effects: 'Excess added sugar drives weight gain, fatty liver, insulin resistance and type-2 diabetes, and raises triglycerides — all fueling chronic inflammation.',
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

  // --- More synthetic dyes (common on candy/snacks) ---
  {
    codes: ['e132'],
    name: 'Indigotine (Blue 2)',
    synonyms: ['indigotine', 'indigo carmine', 'blue 2', 'fd&c blue 2'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Petroleum-derived synthetic dye; part of hyperactivity-study concerns; limited long-term data.',
    source: 'EFSA additive review',
    petroleum: true,
  },
  {
    codes: ['e143'],
    name: 'Fast Green (Green 3)',
    synonyms: ['fast green', 'green 3', 'fd&c green 3'],
    category: 'Colorant',
    risk: 'moderate',
    note: 'Petroleum-derived synthetic dye; banned in the EU, permitted in the US.',
    source: 'FDA; EU (not approved)',
    petroleum: true,
  },

  // --- More commonly-seen safe / low-concern additives ---
  {
    codes: ['e331'],
    name: 'Sodium Citrate',
    synonyms: ['sodium citrate'],
    category: 'Acidity regulator',
    risk: 'safe',
    note: 'Citric-acid salt used as a buffer; no concern.',
    source: 'EFSA',
  },
  {
    codes: ['e903'],
    name: 'Carnauba Wax',
    synonyms: ['carnauba wax', 'carnauba'],
    category: 'Glazing agent',
    risk: 'safe',
    note: 'Plant-derived wax used for shine/coating; well tolerated.',
    source: 'EFSA',
  },
  {
    codes: ['e338'],
    name: 'Phosphoric Acid',
    synonyms: ['phosphoric acid'],
    category: 'Acidity regulator',
    risk: 'limited',
    note: 'Common acidulant (e.g. colas); very high intake linked to lower bone density.',
    effects: 'Heavy cola intake is associated with lower bone mineral density and, in some studies, kidney stones/reduced kidney function — mostly a concern at high, daily amounts.',
    source: 'EFSA additive review',
  },
  {
    codes: ['e412'],
    name: 'Guar Gum',
    synonyms: ['guar gum'],
    category: 'Thickener',
    risk: 'safe',
    note: 'Plant-derived thickener; well tolerated in food amounts.',
    source: 'EFSA',
  },
];
