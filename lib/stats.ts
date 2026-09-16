/**
 * Player stats + badge tiers.
 *
 * NOTE: gameplay data is NOT yet persisted — games are local pass-and-play and
 * scores aren't saved to a database. So `getPlayerStats` currently returns an
 * empty/zeroed shape (honest placeholder). When score-saving is built, wire it
 * to read from Supabase and the /account page will show real numbers with no
 * UI changes needed.
 */

export interface BadgeTier {
  name: string;
  minPoints: number;
  /** Tailwind bg color token for the badge chip. */
  color: string;
}

/** Default tier ladder, lowest first. */
export const BADGE_TIERS: BadgeTier[] = [
  { name: "Bronze", minPoints: 0, color: "bg-at-mustard" },
  { name: "Silver", minPoints: 1000, color: "bg-at-surface-strong" },
  { name: "Gold", minPoints: 5000, color: "bg-at-yellow" },
  { name: "Platinum", minPoints: 15000, color: "bg-at-mint" },
  { name: "Diamond", minPoints: 40000, color: "bg-at-peach" },
];

/** The tier a given point total falls into (and the next tier, if any). */
export function tierForPoints(points: number): {
  current: BadgeTier;
  next: BadgeTier | null;
  pointsToNext: number | null;
} {
  let current = BADGE_TIERS[0];
  let next: BadgeTier | null = null;

  for (let i = 0; i < BADGE_TIERS.length; i++) {
    if (points >= BADGE_TIERS[i].minPoints) {
      current = BADGE_TIERS[i];
      next = BADGE_TIERS[i + 1] ?? null;
    }
  }

  return {
    current,
    next,
    pointsToNext: next ? next.minPoints - points : null,
  };
}

export interface QuizStat {
  quizId: string;
  quizTitle: string;
  timesPlayed: number;
  bestScore: number;
}

export interface PlayerStats {
  totalPoints: number;
  gamesPlayed: number;
  perQuiz: QuizStat[];
}

/**
 * Reads the signed-in player's stats.
 *
 * Placeholder: returns zeroes until gameplay persistence exists. Kept async so
 * swapping in a Supabase query later needs no signature change.
 */
export async function getPlayerStats(): Promise<PlayerStats> {
  return { totalPoints: 0, gamesPlayed: 0, perQuiz: [] };
}
