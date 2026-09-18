import { createSupabaseServerClient } from "./supabase/server";

/** Minimum votes before the aggregate % is shown (small samples are noisy). */
export const RATINGS_MIN_VOTES = 10;

export type Vote = 1 | -1;

export interface RatingSummary {
  gameId: string;
  up: number;
  down: number;
  total: number;
  /** Percent positive (0–100), or null when below the display threshold. */
  percentPositive: number | null;
  /** Whether we have enough votes to show the aggregate. */
  hasEnough: boolean;
  /** The signed-in user's own vote, if any. */
  myVote: Vote | null;
}

function summarize(
  gameId: string,
  up: number,
  down: number,
  myVote: Vote | null
): RatingSummary {
  const total = up + down;
  const hasEnough = total >= RATINGS_MIN_VOTES;
  return {
    gameId,
    up,
    down,
    total,
    hasEnough,
    percentPositive: hasEnough ? Math.round((up / total) * 100) : null,
    myVote,
  };
}

/**
 * Aggregate rating for one game (from the public `game_rating_totals` view)
 * plus the current user's own vote (from `game_ratings`, RLS-scoped).
 */
export async function getRatingSummary(
  gameId: string
): Promise<RatingSummary> {
  const supabase = await createSupabaseServerClient();

  // Aggregate counts (public view — readable by anyone).
  const { data: totals } = await supabase
    .from("game_rating_totals")
    .select("up, down")
    .eq("game_id", gameId)
    .maybeSingle();

  const up = totals?.up ?? 0;
  const down = totals?.down ?? 0;

  // The signed-in user's own vote, if any.
  let myVote: Vote | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: mine } = await supabase
      .from("game_ratings")
      .select("value")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (mine?.value === 1 || mine?.value === -1) myVote = mine.value;
  }

  return summarize(gameId, up, down, myVote);
}
