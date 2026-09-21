import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getQuizById } from "@/lib/quizzes";
import { normalizeCode, isValidCode, type RoomState } from "@/lib/multiplayer/room";
import { applyGuess, applySkip, currentPlayerId } from "@/lib/multiplayer/engine";

/**
 * POST /api/rooms/guess { code, action:"guess"|"skip", guess?, guestId? }
 *
 * Server-authoritative turn play:
 *  - Resolves the caller: logged-in → verified auth id; guest → guestId
 *    (trusted, per the agreed party-game tradeoff).
 *  - Rejects the move unless the caller is the CURRENT player (turn enforcement).
 *  - Applies the move with the reused single-device rules, advances the turn,
 *    and finishes the game if the last turn was played.
 */
export async function POST(request: Request) {
  let body: {
    code?: string;
    action?: string;
    guess?: string;
    guestId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!isValidCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const action = body.action === "skip" ? "skip" : "guess";

  // Resolve caller identity.
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
    .select("id, quiz_id, state")
    .eq("code", code)
    .maybeSingle();
  if (error || !room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const state = room.state as RoomState;
  if (state.phase !== "playing" || !state.game) {
    return NextResponse.json({ error: "Game is not in progress." }, { status: 409 });
  }

  // Turn enforcement — only the current player may act.
  if (currentPlayerId(state.game) !== callerId) {
    return NextResponse.json({ error: "It's not your turn." }, { status: 403 });
  }

  const quiz = getQuizById(room.quiz_id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 500 });
  }

  let result;
  if (action === "skip") {
    result = applySkip(state.game);
  } else {
    const guess = (body.guess ?? "").trim();
    if (!guess) {
      return NextResponse.json({ error: "Enter a guess." }, { status: 400 });
    }
    result = applyGuess(state.game, quiz, guess);
  }

  state.game = result.game;
  if (result.finished) state.phase = "finished";

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not apply move." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
