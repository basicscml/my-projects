import { ADDITIVES, AdditiveInfo, IngredientRisk } from '../data/additives';

export type MatchedIngredient = {
  /** The raw ingredient text as it appeared on the label. */
  raw: string;
  info: AdditiveInfo | null; // null = not in our dataset ("unknown")
};

export type IngredientAnalysis = {
  ingredients: MatchedIngredient[];
  /** 0–100, additive/ingredient-concern focused (nutrition not included). */
  score: number;
  grade: 'Excellent' | 'Good' | 'Poor' | 'Bad';
  counts: Record<IngredientRisk, number>;
  unknownCount: number;
  additiveCount: number;
  /** How many matched ingredients are petroleum/crude-oil derived. */
  petroleumCount: number;
};

const RISK_PENALTY: Record<IngredientRisk, number> = {
  safe: 0,
  limited: 5,
  moderate: 15,
  high: 30,
};

const E_NUMBER = /e\s?-?\s?(\d{3,4})[a-z]?/gi;

/**
 * Split a raw ingredients list into individual ingredient tokens.
 * Handles commas, semicolons, and nested parentheses like
 * "emulsifier (soy lecithin), color (e150d)".
 */
export function splitIngredients(raw: string): string[] {
  // Flatten parentheses into separators so contained items are captured too.
  const flattened = raw
    .replace(/ingredients?:?/i, ' ')
    .replace(/[()\[\]]/g, ',')
    .replace(/\band\b/gi, ',');
  return flattened
    .split(/[,;.\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function lookup(token: string): AdditiveInfo | null {
  const lower = token.toLowerCase();
  // Normalize colorant variants so "Red 40 Lake" / "FD&C Red 40" resolve to the
  // base dye. ("Lake" is just the insoluble pigment form of the same dye.)
  const norm = lower
    .replace(/fd\s*&\s*c\s*/g, '')
    .replace(/\blakes?\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 1) E-number match anywhere in the token.
  const codes: string[] = [];
  let m: RegExpExecArray | null;
  E_NUMBER.lastIndex = 0;
  while ((m = E_NUMBER.exec(lower)) !== null) {
    codes.push(`e${m[1]}`);
  }
  for (const code of codes) {
    const hit = ADDITIVES.find((a) => a.codes.includes(code));
    if (hit) return hit;
  }

  // 2) Name / synonym substring match (on the normalized text, then raw).
  for (const a of ADDITIVES) {
    if (a.synonyms.some((syn) => norm.includes(syn) || lower.includes(syn))) return a;
    const name = a.name.toLowerCase();
    if (norm.includes(name) || lower.includes(name)) return a;
  }
  return null;
}

export function analyzeIngredients(raw: string): IngredientAnalysis {
  const tokens = splitIngredients(raw);
  const seen = new Set<string>();
  const ingredients: MatchedIngredient[] = [];

  for (const token of tokens) {
    const info = lookup(token);
    // De-dupe by matched additive (or by raw text when unknown).
    const key = info ? info.name : token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ingredients.push({ raw: token, info });
  }

  const counts: Record<IngredientRisk, number> = {
    safe: 0,
    limited: 0,
    moderate: 0,
    high: 0,
  };
  let penalty = 0;
  let additiveCount = 0;
  let unknownCount = 0;
  let petroleumCount = 0;

  for (const ing of ingredients) {
    if (!ing.info) {
      unknownCount += 1;
      continue;
    }
    counts[ing.info.risk] += 1;
    penalty += RISK_PENALTY[ing.info.risk];
    if (ing.info.codes.length > 0) additiveCount += 1;
    if (ing.info.petroleum) petroleumCount += 1;
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Poor' : 'Bad';

  return { ingredients, score, grade, counts, unknownCount, additiveCount, petroleumCount };
}

export function riskColor(risk: IngredientRisk): string {
  switch (risk) {
    case 'safe':
      return '#3BA99C';
    case 'limited':
      return '#7BA05B';
    case 'moderate':
      return '#E0A458';
    case 'high':
      return '#D96A6A';
  }
}

export function riskLabel(risk: IngredientRisk): string {
  switch (risk) {
    case 'safe':
      return 'No concern';
    case 'limited':
      return 'Low risk';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High concern';
  }
}

/** A realistic ingredients list for the "try a sample" flow. */
export const SAMPLE_INGREDIENTS =
  'Ingredients: Corn syrup, sugar, palm oil, wheat flour, cocoa, ' +
  'high fructose corn syrup, salt, soy lecithin (E322), ' +
  'artificial color (E102, E129), sodium benzoate (E211), ' +
  'BHT (E321), natural and artificial flavor, citric acid (E330).';
