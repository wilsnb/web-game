import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeCode,
  isValidCode,
  MP_IMPOSTOR_MIN_PLAYERS,
  type RoomState,
} from "@/lib/multiplayer/room";
import { pickWordPair } from "@/lib/impostor/words";
import {
  impostorCountFor,
  pickImpostors,
  buildImpostorState,
} from "@/lib/impostor/engine";
import { writeRoomSecrets, type SecretRole } from "@/lib/impostor/secrets";

/**
 * POST /api/rooms/impostor/start { code } — host-only.
 * Assigns impostor role(s) + the group/decoy words, writes them to the
 * server-only room_secrets table, and flips the room into the role-reveal
 * phase. The secret roles are NEVER written into the streamed room state.
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
  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can start the game." },
      { status: 403 }
    );
  }

  const state = room.state as RoomState;
  if (state.mode !== "impostor") {
    return NextResponse.json({ error: "Not an impostor room." }, { status: 409 });
  }
  if (state.phase !== "lobby") {
    return NextResponse.json({ error: "Game already started." }, { status: 409 });
  }
  if (state.players.length < MP_IMPOSTOR_MIN_PLAYERS) {
    return NextResponse.json(
      { error: `Need at least ${MP_IMPOSTOR_MIN_PLAYERS} players.` },
      { status: 400 }
    );
  }

  // Assign roles + words (server-side randomness).
  const rand = Math.random;
  const pair = pickWordPair(rand);
  const impostorCount = impostorCountFor(state.players.length);
  const impostorIdx = new Set(
    pickImpostors(state.players.length, impostorCount, rand)
  );

  const roles: SecretRole[] = state.players.map((p, i) => ({
    playerId: p.id,
    isImpostor: impostorIdx.has(i),
    word: impostorIdx.has(i) ? pair.decoy : pair.group,
  }));
  await writeRoomSecrets(code, roles);

  // Non-secret state: phase + category hint only (NO roles, NO words).
  state.phase = "playing";
  state.impostor = buildImpostorState(state.players, pair.category, impostorCount);

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not start." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
