import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCode, isValidCode, type RoomState } from "@/lib/multiplayer/room";

/**
 * POST /api/rooms/submit-score { code, score, guestId? }
 *
 * Solo-race: a player reports their final score. We record it in their
 * soloResults entry and mark them finished. When every player is finished, the
 * room flips to "finished" so all screens show the final leaderboard.
 *
 * Resolves the caller like the guess route: auth id, else trusted guestId.
 */
export async function POST(request: Request) {
  let body: { code?: string; score?: number; guestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!isValidCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const score = Number(body.score);
  if (!Number.isFinite(score)) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const callerId = user?.id ?? (body.guestId ?? "").trim();
  if (!callerId) {
    return NextResponse.json({ error: "Could not identify you." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: room, error } = await admin
    .from("rooms")
    .select("id, state")
    .eq("code", code)
    .maybeSingle();
  if (error || !room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const state = room.state as RoomState;
  if (state.mode !== "solo-race" || !state.soloResults) {
    return NextResponse.json({ error: "Not a solo-race room." }, { status: 409 });
  }
  if (state.phase !== "playing") {
    return NextResponse.json({ error: "Game is not in progress." }, { status: 409 });
  }

  const entry = state.soloResults.find((r) => r.playerId === callerId);
  if (!entry) {
    return NextResponse.json({ error: "You're not in this game." }, { status: 403 });
  }

  // Record the score once (ignore duplicate submissions after finishing).
  if (entry.status !== "finished") {
    entry.score = score;
    entry.status = "finished";
  }

  // When everyone has finished, end the game.
  if (state.soloResults.every((r) => r.status === "finished")) {
    state.phase = "finished";
  }

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not submit score." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
