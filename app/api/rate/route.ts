import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRatingSummary } from "@/lib/ratings";

/**
 * GET /api/rate?game=<id>  — read the current summary (aggregate + my vote).
 * POST /api/rate { gameId, value }  — cast/change/clear a vote.
 *   value: 1 (up), -1 (down), or 0 (remove my vote).
 *
 * Logged-in only to vote. One row per (user, game) enforced by a DB primary
 * key, so a user has exactly one changeable vote per game.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("game");
  if (!gameId) {
    return NextResponse.json({ error: "Missing game" }, { status: 400 });
  }
  return NextResponse.json(await getRatingSummary(gameId));
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to rate." },
      { status: 401 }
    );
  }

  let body: { gameId?: string; value?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { gameId, value } = body;
  if (!gameId || (value !== 1 && value !== -1 && value !== 0)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (value === 0) {
    // Remove the user's vote.
    const { error } = await supabase
      .from("game_ratings")
      .delete()
      .eq("game_id", gameId)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: "Could not update." }, { status: 500 });
    }
  } else {
    // Upsert the user's single vote for this game.
    const { error } = await supabase.from("game_ratings").upsert(
      {
        user_id: user.id,
        game_id: gameId,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_id" }
    );
    if (error) {
      return NextResponse.json({ error: "Could not update." }, { status: 500 });
    }
  }

  return NextResponse.json(await getRatingSummary(gameId));
}
