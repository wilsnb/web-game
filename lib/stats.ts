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

import { createSupabaseServerClient } from "./supabase/server";

interface GameResultRow {
  quiz_id: string;
  quiz_title: string;
  top_score: number;
}

/**
 * Reads the signed-in player's stats, aggregated from their saved game_results.
 *
 * "Points" = the sum of each game's top (winning) score. Games played = number
 * of rows. Per-quiz = grouped by quiz with times played and best score.
 * Returns zeroes when signed out or when no games have been saved yet.
 */
export async function getPlayerStats(): Promise<PlayerStats> {
  const empty: PlayerStats = { totalPoints: 0, gamesPlayed: 0, perQuiz: [] };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data, error } = await supabase
    .from("game_results")
    .select("quiz_id, quiz_title, top_score")
    .eq("user_id", user.id);

  if (error || !data || data.length === 0) return empty;

  const rows = data as GameResultRow[];
  const totalPoints = rows.reduce((n, r) => n + (r.top_score ?? 0), 0);

  // Group by quiz.
  const byQuiz = new Map<string, QuizStat>();
  for (const r of rows) {
    const existing = byQuiz.get(r.quiz_id);
    if (existing) {
      existing.timesPlayed += 1;
      existing.bestScore = Math.max(existing.bestScore, r.top_score ?? 0);
    } else {
      byQuiz.set(r.quiz_id, {
        quizId: r.quiz_id,
        quizTitle: r.quiz_title,
        timesPlayed: 1,
        bestScore: r.top_score ?? 0,
      });
    }
  }

  const perQuiz = [...byQuiz.values()].sort(
    (a, b) => b.timesPlayed - a.timesPlayed
  );

  return { totalPoints, gamesPlayed: rows.length, perQuiz };
}
