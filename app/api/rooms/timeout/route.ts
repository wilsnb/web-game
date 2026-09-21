import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCode, isValidCode, type RoomState } from "@/lib/multiplayer/room";
import { applySkip } from "@/lib/multiplayer/engine";

/**
 * POST /api/rooms/timeout { code, guestId? }
 *
 * Skips the current player's turn. Two authorized paths:
 *  - Auto-skip: ANY client (player or guest in the room) may fire this once the
 *    turn deadline passes. The server re-validates `Date.now() > turnEndsAt`
 *    before skipping, so a client cannot force an early skip by lying.
 *  - Host force-skip: the room host may skip the current player at any time
 *    (manual override for a disconnected/slow player), no deadline required.
 *
 * Idempotent-ish: if two clients race to report the same expiry, the second
 * call simply finds the deadline already refreshed for the next player and is
 * rejected as "not expired yet" — harmless.
 */
export async function POST(request: Request) {
  let body: { code?: string; guestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!isValidCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Resolve caller identity (auth id, or trusted guest id).
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
    .select("id, host_id, state")
    .eq("code", code)
    .maybeSingle();
  if (error || !room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const state = room.state as RoomState;
  if (state.phase !== "playing" || !state.game) {
    return NextResponse.json({ error: "Game is not in progress." }, { status: 409 });
  }

  const isHost = user?.id === room.host_id;
  const expired = Date.now() > state.game.turnEndsAt;

  // Non-hosts may only trigger a skip once the timer has actually expired.
  if (!isHost && !expired) {
    return NextResponse.json(
      { error: "The turn timer hasn't expired yet." },
      { status: 409 }
    );
  }

  const result = applySkip(state.game);
  state.game = result.game;
  if (result.finished) state.phase = "finished";

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not skip turn." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, skippedBy: isHost ? "host" : "timeout" });
}
