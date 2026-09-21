import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeCode,
  isValidCode,
  buildRoomGame,
  type RoomState,
} from "@/lib/multiplayer/room";

/**
 * POST /api/rooms/start { code } — host-only: starts the game.
 * Initializes the server-authoritative game state from the current players +
 * the host's chosen settings, and flips phase to "playing". Realtime pushes
 * the new state to every player, so all screens move to the game together.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!isValidCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
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

  // Only the host may start the game.
  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can start the game." },
      { status: 403 }
    );
  }

  const state = room.state as RoomState;
  if (state.phase !== "lobby") {
    return NextResponse.json({ error: "Game already started." }, { status: 409 });
  }
  if (state.players.length < 1) {
    return NextResponse.json({ error: "Need at least one player." }, { status: 400 });
  }

  state.phase = "playing";
  state.game = buildRoomGame(state.players, state.settings);

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not start." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
