import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCode, isValidCode, type RoomState } from "@/lib/multiplayer/room";
import {
  tallyVotes,
  evaluateWin,
  startNextRound,
  isDuplicateClue,
} from "@/lib/impostor/engine";
import { getAllRoles } from "@/lib/impostor/secrets";

/**
 * POST /api/rooms/impostor/action
 *   { code, action, guestId?, ...payload }
 *
 * One server-authoritative endpoint for every in-game impostor action:
 *   - "ready"  : mark yourself ready on the role-reveal screen
 *   - "clue"   : { text } submit your clue (only on your turn)
 *   - "vote"   : { suspectId } cast/replace your vote
 *   - "guess"  : { word } ejected impostor's one word guess
 *   - "advance": host-only force-advance (skip a slow/disconnected player)
 *
 * Phases auto-advance when everyone has acted; the host can also force it.
 */
export async function POST(request: Request) {
  let body: {
    code?: string;
    action?: string;
    guestId?: string;
    text?: string;
    suspectId?: string;
    word?: string;
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
  const action = body.action ?? "";

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
  const imp = state.impostor;
  if (state.mode !== "impostor" || !imp) {
    return NextResponse.json({ error: "Not an impostor game." }, { status: 409 });
  }
  const isHost = user?.id === room.host_id;
  const isPlayer = imp.order.includes(callerId);
  if (!isPlayer) {
    return NextResponse.json({ error: "You're not in this game." }, { status: 403 });
  }

  // Roles are needed for any transition that checks win state / impostor-ness.
  const roles = await getAllRoles(code);
  const impostorIds = new Set(
    roles.filter((r) => r.isImpostor).map((r) => r.playerId)
  );
  const groupWord = roles.find((r) => !r.isImpostor)?.word ?? null;

  const nameOf = (id: string) =>
    state.players.find((p) => p.id === id)?.name ?? "Player";

  const isLiving = imp.living.includes(callerId);

  function finishGame(winner: "crew" | "impostors", reason: string) {
    imp!.phase = "results";
    imp!.revealWord = groupWord;
    imp!.result = {
      winner,
      reason,
      roles: imp!.order.map((id) => ({
        playerId: id,
        name: nameOf(id),
        wasImpostor: impostorIds.has(id),
      })),
    };
  }

  switch (action) {
    case "ready": {
      if (imp.phase !== "reveal-role") break;
      if (!imp.ready.includes(callerId)) imp.ready.push(callerId);
      if (imp.ready.length >= imp.order.length) {
        imp.phase = "clues";
      }
      break;
    }

    case "clue": {
      if (imp.phase !== "clues") break;
      if (!isLiving) {
        return NextResponse.json({ error: "You've been voted out." }, { status: 403 });
      }
      if (imp.clueOrder[imp.clueIndex] !== callerId) {
        return NextResponse.json({ error: "It's not your turn." }, { status: 403 });
      }
      const text = (body.text ?? "").trim().slice(0, 40);
      if (!text) {
        return NextResponse.json({ error: "Enter a clue." }, { status: 400 });
      }
      if (isDuplicateClue(imp.clues, text)) {
        return NextResponse.json(
          { error: "That clue was already given — try a different one." },
          { status: 409 }
        );
      }
      imp.clues.push({ playerId: callerId, name: nameOf(callerId), text });
      imp.clueIndex += 1;
      if (imp.clueIndex >= imp.clueOrder.length) {
        imp.phase = "voting";
      }
      break;
    }

    case "vote": {
      if (imp.phase !== "voting") break;
      if (!isLiving) {
        return NextResponse.json({ error: "Spectators can't vote." }, { status: 403 });
      }
      const suspectId = (body.suspectId ?? "").trim();
      if (!imp.living.includes(suspectId)) {
        return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
      }
      imp.votes[callerId] = suspectId;
      // Everyone living voted? Resolve the ejection.
      if (Object.keys(imp.votes).length >= imp.living.length) {
        resolveVoting(imp, impostorIds);
      }
      break;
    }

    case "guess": {
      if (imp.phase !== "impostor-guess") break;
      // Only the just-ejected impostor may guess.
      if (imp.ejectedId !== callerId || !impostorIds.has(callerId)) {
        return NextResponse.json({ error: "Not your guess." }, { status: 403 });
      }
      const guess = (body.word ?? "").trim().toLowerCase();
      const correct =
        groupWord != null && guess === groupWord.trim().toLowerCase();
      if (correct) {
        finishGame("impostors", "The last impostor was caught — but guessed the word to steal the win!");
      } else {
        finishGame("crew", "The last impostor was caught and guessed wrong. Crew wins!");
      }
      break;
    }

    case "next": {
      // Timed progression from the ejection reveal — any player may trigger
      // (idempotent). Decides win / impostor-guess / next round.
      if (imp.phase !== "ejection") break;
      afterEjection(imp, impostorIds);
      break;
    }

    case "advance": {
      // Host override: force the current phase to resolve/move on.
      if (!isHost) {
        return NextResponse.json({ error: "Host only." }, { status: 403 });
      }
      forceAdvance(imp, impostorIds);
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  // Tally votes, remove the ejected player from living, go to the reveal.
  function resolveVoting(s: NonNullable<RoomState["impostor"]>, impostors: Set<string>) {
    const ejectedId = tallyVotes(s.votes);
    s.ejectedId = ejectedId;
    s.ejectedWasImpostor = ejectedId ? impostors.has(ejectedId) : false;
    if (ejectedId) {
      s.living = s.living.filter((id) => id !== ejectedId);
    }
    s.phase = "ejection";
  }

  // From the ejection reveal: decide the next step in the elimination loop.
  function afterEjection(s: NonNullable<RoomState["impostor"]>, impostors: Set<string>) {
    const ejectedWasImpostor = Boolean(s.ejectedId && impostors.has(s.ejectedId));
    const liveImpostors = s.living.filter((id) => impostors.has(id)).length;

    // Crew just caught the FINAL impostor → that impostor gets the steal-guess.
    if (ejectedWasImpostor && liveImpostors === 0) {
      s.phase = "impostor-guess";
      return;
    }

    const outcome = evaluateWin(s.living, impostors);
    if (outcome === "impostors") {
      finishGame("impostors", "The impostors now equal the crew — impostors win!");
      return;
    }
    if (outcome === "crew") {
      // (Shouldn't hit here since the final-impostor case is handled above,
      // but guard anyway.)
      finishGame("crew", "All impostors have been caught. Crew wins!");
      return;
    }
    // Game continues: another clue + vote round with the remaining players.
    startNextRound(s);
  }

  // Host force-advance depending on the current phase.
  function forceAdvance(s: NonNullable<RoomState["impostor"]>, impostors: Set<string>) {
    switch (s.phase) {
      case "reveal-role":
        s.phase = "clues";
        break;
      case "clues":
        s.phase = "voting";
        break;
      case "voting":
        resolveVoting(s, impostors);
        break;
      case "ejection":
        afterEjection(s, impostors);
        break;
      case "impostor-guess":
        // Ejected final impostor didn't guess in time → crew wins.
        finishGame("crew", "The last impostor was caught and didn't guess the word. Crew wins!");
        break;
    }
  }

  const { error: upErr } = await admin
    .from("rooms")
    .update({ state })
    .eq("id", room.id);
  if (upErr) {
    return NextResponse.json({ error: "Could not apply action." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
