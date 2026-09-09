// KinoVibe Scoring & Math Engine

export const TIERS = [
  { label: 'S', min: 9.0, max: 10.0, color: '#fbbf24', desc: 'Masterpiece' },
  { label: 'A', min: 8.0, max: 8.9,  color: '#f43f5e', desc: 'Great' },
  { label: 'B', min: 7.0, max: 7.9,  color: '#f97316', desc: 'Good' },
  { label: 'C', min: 6.0, max: 6.9,  color: '#eab308', desc: 'Decent' },
  { label: 'D', min: 5.0, max: 5.9,  color: '#22c55e', desc: 'Mediocre' },
  { label: 'E', min: 4.0, max: 4.9,  color: '#3b82f6', desc: 'Poor' },
  { label: 'F', min: 0.0, max: 3.9,  color: '#6b7280', desc: 'Skip' }
];

/**
 * Calculates base score, total bias, and final score.
 * Base = (Story + Visuals + Action + Fun) / 4
 * Final = clamp(0, 10, (Story + Visuals + Action + Fun + totalBias) / 4)
 */
export function calcScores(story, visuals, action, fun, biases = []) {
  const s = Number(story) || 0;
  const v = Number(visuals) || 0;
  const a = Number(action) || 0;
  const f = Number(fun) || 0;

  const base = (s + v + a + f) / 4;

  const totalBias = (biases || []).reduce((sum, b) => {
    if (b === null || b === undefined) return sum;
    const rawVal = typeof b === 'object' ? b.amount : b;
    if (typeof rawVal === 'number') {
      return sum + (isNaN(rawVal) ? 0 : rawVal);
    }
    const clean = String(rawVal || '').trim().replace(/\s+/g, '').replace(',', '.');
    const amt = parseFloat(clean);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const roundedBase = Math.round(base * 10) / 10;
  const roundedBias = Math.round(totalBias * 10) / 10;
  const raw = (s + v + a + f + totalBias) / 4;
  const clampedFinal = Math.max(0, Math.min(10, raw));

  return {
    base: roundedBase,
    totalBias: roundedBias,
    final: Math.round(clampedFinal * 10) / 10
  };
}

/**
 * Returns score level class ('high' | 'mid' | 'low')
 */
export function getScoreLevel(score) {
  const num = Number(score) || 0;
  if (num >= 7) return 'high';
  if (num >= 4.5) return 'mid';
  return 'low';
}

/**
 * Returns corresponding tier object
 */
export function getTierForScore(score) {
  const num = Number(score) || 0;
  for (const t of TIERS) {
    if (num >= t.min) return t;
  }
  return TIERS[TIERS.length - 1];
}

/**
 * Format score to 1 decimal place
 */
export function formatScore(num) {
  return (Number(num) || 0).toFixed(1);
}
