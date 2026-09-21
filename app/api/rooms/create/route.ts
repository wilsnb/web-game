import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profile";
import {
  generateRoomCode,
  initialRoomState,
  MP_MIN_ROUNDS,
  MP_MAX_ROUNDS,
  MP_MIN_GUESSES,
  MP_MAX_GUESSES,
  MP_MIN_TURN_SECONDS,
  MP_MAX_TURN_SECONDS,
  type RoomPlayer,
} from "@/lib/multiplayer/room";
import { getQuizById } from "@/lib/quizzes";

/**
 * POST /api/rooms/create { quizId } — host creates a room.
 * Host must be signed in. Returns the room code to share.
 *
 * Uses the admin client for the write so room read/update policies can stay
 * permissive for guest joiners without exposing a broad write policy.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to host a room." },
      { status: 401 }
    );
  }

  let body: {
    quizId?: string;
    rounds?: number;
    guessesPerRound?: number;
    turnSeconds?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const quizId = body.quizId;
  if (!quizId || !getQuizById(quizId)) {
    return NextResponse.json({ error: "Pick a valid quiz." }, { status: 400 });
  }

  const rounds = Number(body.rounds);
  const guessesPerRound = Number(body.guessesPerRound);
  const turnSeconds = Number(body.turnSeconds);
  if (
    !Number.isInteger(rounds) ||
    rounds < MP_MIN_ROUNDS ||
    rounds > MP_MAX_ROUNDS ||
    !Number.isInteger(guessesPerRound) ||
    guessesPerRound < MP_MIN_GUESSES ||
    guessesPerRound > MP_MAX_GUESSES ||
    !Number.isInteger(turnSeconds) ||
    turnSeconds < MP_MIN_TURN_SECONDS ||
    turnSeconds > MP_MAX_TURN_SECONDS
  ) {
    return NextResponse.json({ error: "Invalid game settings." }, { status: 400 });
  }

  const profile = await getProfile();
  const hostName =
    profile?.username ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Host";

  const host: RoomPlayer = {
    id: user.id,
    name: hostName,
    isHost: true,
    isGuest: false,
  };

  const admin = createSupabaseAdminClient();

  // Try a few codes in case of a rare collision.
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await admin
      .from("rooms")
      .insert({
        code,
        host_id: user.id,
        quiz_id: quizId,
        state: initialRoomState(host, quizId, {
          rounds,
          guessesPerRound,
          turnSeconds,
        }),
      })
      .select("code")
      .single();

    if (!error && data) {
      return NextResponse.json({ code: data.code });
    }
    // 23505 = unique_violation on code — retry with a new code.
    if (error && error.code !== "23505") {
      console.error("room create failed:", error);
      return NextResponse.json(
        { error: "Could not create room." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Could not allocate a room code, try again." },
    { status: 500 }
  );
}
