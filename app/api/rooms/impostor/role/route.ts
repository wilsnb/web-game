import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCode, isValidCode } from "@/lib/multiplayer/room";
import { getPlayerRole } from "@/lib/impostor/secrets";

/**
 * POST /api/rooms/impostor/role { code, guestId? }
 * Returns ONLY the calling player's own secret role (impostor flag + word).
 * The secret never enters the streamed room state — each client fetches just
 * their own card here, authenticated by caller id (auth id or trusted guestId).
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const callerId = user?.id ?? (body.guestId ?? "").trim();
  if (!callerId) {
    return NextResponse.json({ error: "Could not identify you." }, { status: 401 });
  }

  const role = await getPlayerRole(code, callerId);
  if (!role) {
    return NextResponse.json({ error: "No role yet." }, { status: 404 });
  }

  return NextResponse.json({
    isImpostor: role.isImpostor,
    word: role.word,
  });
}
