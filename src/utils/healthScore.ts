import { NutriScore } from './openFoodFacts';

export type BlendedHealth = {
  score: number; // 0..100
  grade: 'Excellent' | 'Good' | 'Poor' | 'Bad';
  /** Which signals fed the score — shown to the user for transparency. */
  basis: string[];
};

// Nutri-Score grade → 0..100 nutrition score.
const NUTRI_POINTS: Record<Exclude<NutriScore, null>, number> = {
  a: 100,
  b: 80,
  c: 60,
  d: 40,
  e: 20,
};

function gradeFor(score: number): BlendedHealth['grade'] {
  return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Poor' : 'Bad';
}

/**
 * Combine our additive-risk score with Open Food Facts' Nutri-Score and NOVA
 * processing level into a single 0–100 health score — the same spirit as Yuka
 * (nutrition-weighted, additives second), adapted to the signals we actually
 * have. Transparent by design: `basis` lists exactly what was used, and missing
 * signals simply drop out rather than being guessed.
 *
 * Weighting when nutrition is available: 60% nutrition + 40% additives
 * (Yuka is ~60/30/10 nutrition/additives/organic; with no organic signal we
 * fold that weight into additives). NOVA applies a small processing modifier.
 */
export function blendHealth(
  additiveScore: number,
  nutriScore: NutriScore,
  novaGroup: number | null
): BlendedHealth {
  const basis = ['additives'];
  let score: number;

  const nutrition = nutriScore ? NUTRI_POINTS[nutriScore] : null;
  if (nutrition != null) {
    score = 0.6 * nutrition + 0.4 * additiveScore;
    basis.push('Nutri-Score');
  } else {
    score = additiveScore;
  }

  if (novaGroup != null) {
    const mod = novaGroup === 4 ? -10 : novaGroup === 3 ? -4 : novaGroup === 1 ? 5 : 0;
    if (mod !== 0) {
      score += mod;
      basis.push('processing');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, grade: gradeFor(score), basis };
}
