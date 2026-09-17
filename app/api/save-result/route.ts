import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Saves one finished game's result for the signed-in host.
 *
 * Pass-and-play: multiple teams share the device; the logged-in user is the
 * host. We store the full team breakdown and the top (winning) score, which is
 * what the host's stats/points are based on.
 *
 * Auth-gated; writes via the user-scoped client so Row Level Security ensures
 * a user can only insert their own rows.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests can play; we just don't save their results.
  if (!user) {
    return NextResponse.json({ saved: false, reason: "not_signed_in" });
  }

  let body: {
    quizId?: string;
    quizTitle?: string;
    teams?: { name: string; score: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { quizId, quizTitle, teams } = body;

  // Basic validation.
  if (
    !quizId ||
    !quizTitle ||
    !Array.isArray(teams) ||
    teams.length === 0 ||
    teams.some(
      (t) =>
        typeof t?.name !== "string" ||
        typeof t?.score !== "number" ||
        !Number.isFinite(t.score) ||
        t.score < 0
    )
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const topScore = Math.max(...teams.map((t) => t.score));

  const { error } = await supabase.from("game_results").insert({
    user_id: user.id,
    quiz_id: quizId,
    quiz_title: quizTitle,
    top_score: topScore,
    teams, // jsonb: full breakdown for future use
  });

  if (error) {
    console.error("save-result insert failed:", error);
    return NextResponse.json({ error: "Could not save result" }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
