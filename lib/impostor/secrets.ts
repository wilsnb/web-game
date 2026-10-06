import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only access to per-player secret roles for the impostor game.
 *
 * Secrets live in a dedicated `room_secrets` table that is NOT part of the
 * Supabase realtime publication, so they are never streamed to browsers. Each
 * player fetches ONLY their own role through an authenticated endpoint.
 *
 * Table shape (see the SQL handed to the user):
 *   room_secrets(room_code text, player_id text, is_impostor bool,
 *                word text, created_at timestamptz, primary key(room_code, player_id))
 */

export interface SecretRole {
  playerId: string;
  isImpostor: boolean;
  /** The word this player sees (group word for crew, decoy for impostor). */
  word: string;
}

/** Overwrite the secret roles for a room (called once at game start). */
export async function writeRoomSecrets(
  roomCode: string,
  roles: SecretRole[]
): Promise<void> {
  const admin = createSupabaseAdminClient();
  // Clear any prior game's secrets for this room, then insert fresh.
  await admin.from("room_secrets").delete().eq("room_code", roomCode);
  await admin.from("room_secrets").insert(
    roles.map((r) => ({
      room_code: roomCode,
      player_id: r.playerId,
      is_impostor: r.isImpostor,
      word: r.word,
    }))
  );
}

/** Read a single player's role (server-side only). */
export async function getPlayerRole(
  roomCode: string,
  playerId: string
): Promise<SecretRole | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("room_secrets")
    .select("player_id, is_impostor, word")
    .eq("room_code", roomCode)
    .eq("player_id", playerId)
    .maybeSingle();
  if (!data) return null;
  return {
    playerId: data.player_id as string,
    isImpostor: data.is_impostor as boolean,
    word: data.word as string,
  };
}

/** Read all roles for a room (server-side only; used at results/eviction). */
export async function getAllRoles(roomCode: string): Promise<SecretRole[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("room_secrets")
    .select("player_id, is_impostor, word")
    .eq("room_code", roomCode);
  return (data ?? []).map((d) => ({
    playerId: d.player_id as string,
    isImpostor: d.is_impostor as boolean,
    word: d.word as string,
  }));
}

/** Delete a room's secrets (cleanup when a game ends/room is abandoned). */
export async function clearRoomSecrets(roomCode: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("room_secrets").delete().eq("room_code", roomCode);
}
