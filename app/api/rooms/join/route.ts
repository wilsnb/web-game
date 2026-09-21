import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profile";
import {
  normalizeCode,
  isValidCode,
  type RoomPlayer,
  type RoomState,
} from "@/lib/multiplayer/room";

/**
 * POST /api/rooms/join { code, guestName? } — add the caller to a room.
 *  - Logged-in players join with their username (id = auth id).
 *  - Guests join with a typed name (id = provided guestId).
 * Returns the player id so the client knows which player it is.
 */
export async function POST(request: Request) {
  let body: { code?: string; guestName?: string; guestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!isValidCode(code)) {
    return NextResponse.json({ error: "Enter a valid room code." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build the joining player.
  let player: RoomPlayer;
  if (user) {
    const profile = await getProfile();
    player = {
      id: user.id,
      name:
        profile?.username ||
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "Player",
      isHost: false,
      isGuest: false,
    };
  } else {
    const guestName = (body.guestName ?? "").trim();
    const guestId = (body.guestId ?? "").trim();
    if (!guestName || guestName.length > 24 || !guestId) {
      return NextResponse.json(
        { error: "Enter your name to join." },
        { status: 400 }
      );
    }
    player = { id: guestId, name: guestName, isHost: false, isGuest: true };
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
  // Add the player if not already present (idempotent rejoin).
  const already = state.players.some((p) => p.id === player.id);
  if (!already) {
    state.players = [...state.players, player];
    const { error: upErr } = await admin
      .from("rooms")
      .update({ state })
      .eq("id", room.id);
    if (upErr) {
      return NextResponse.json({ error: "Could not join." }, { status: 500 });
    }
  }

  return NextResponse.json({ code, playerId: player.id });
}
