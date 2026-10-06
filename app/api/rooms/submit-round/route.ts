import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCode, isValidCode, type RoomState } from "@/lib/multiplayer/room";

const TOTAL_ROUNDS = 10;

/**
 * POST /api/rooms/submit-round
 *   { code, action: "answer"|"advance", round, correct?, points?, guestId? }
 *
 * Round-synchronized solo-race:
 *  - "answer": record the caller's result for `round`. When every player has
 *    answered, flip roundPhase to "reveal" (everyone sees who got it).
 *  - "advance": once in reveal, any client can request moving on. The server
 *    advances to the next round (resets answeredCurrent) or, after the last
 *    round, flips the room to "finished".
 *
 * All writes are server-validated: the caller must be a participant, and the
 * round number must match the room's current round.
 */
export async function POST(request: Request) {
  let body: {
    code?: string;
    action?: string;
    round?: number;
    correct?: boolean;
    points?: number;
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

  const action = body.action === "advance" ? "advance" : "answer";
  const current = state.currentRound ?? 0;

  if (action === "answer") {
    const round = Number(body.round);
    // Ignore stale/duplicate submissions (wrong round or already answered).
    if (round === current && !entry.answeredCurrent) {
      const correct = Boolean(body.correct);
      const points = Math.max(0, Math.min(1000, Math.round(Number(body.points) || 0)));
      entry.rounds[current] = { correct, points };
      entry.total += points;
      entry.answeredCurrent = true;

      // Everyone in? Move to the reveal.
      if (state.soloResults.every((r) => r.answeredCurrent)) {
        state.roundPhase = "reveal";
      }
    }
  } else {
    // advance: only valid while revealing. Idempotent if already moved.
    if (state.roundPhase === "reveal") {
      if (current + 1 >= TOTAL_ROUNDS) {
        state.phase = "finished";
      } else {
        state.currentRound = current + 1;
        state.roundPhase = "playing";
        state.soloResults.forEach((r) => {
          r.answeredCurrent = false;
        });
      }
    }
  }

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not submit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
