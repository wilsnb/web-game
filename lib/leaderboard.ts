import { createSupabaseServerClient } from "./supabase/server";

export interface LeaderboardRow {
  username: string;
  quizId: string;
  quizTitle: string;
  topScore: number;
}

/**
 * Reads top scores from the `public_leaderboard` view (only public profiles).
 * Optionally filtered to one quiz. Returns highest scores first.
 *
 * The view is defined in Supabase (see setup SQL) and exposes only
 * username + quiz + score for users who opted into a public profile.
 */
export async function getLeaderboard(
  quizId?: string,
  limit = 20
): Promise<LeaderboardRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("public_leaderboard")
    .select("username, quiz_id, quiz_title, top_score")
    .order("top_score", { ascending: false })
    .limit(limit);

  if (quizId) query = query.eq("quiz_id", quizId);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r) => ({
    username: r.username,
    quizId: r.quiz_id,
    quizTitle: r.quiz_title,
    topScore: r.top_score,
  }));
}
