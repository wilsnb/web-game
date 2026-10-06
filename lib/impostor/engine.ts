import type { ImpostorState, RoomPlayer } from "@/lib/multiplayer/room";
import { MP_IMPOSTOR_TWO_AT } from "@/lib/multiplayer/room";

/** Number of impostors for a given player count: 1, or 2 when 6+ players. */
export function impostorCountFor(playerCount: number): number {
  return playerCount >= MP_IMPOSTOR_TWO_AT ? 2 : 1;
}

/** Pick `count` distinct impostor indices from `n` players using an RNG. */
export function pickImpostors(n: number, count: number, rand: () => number): number[] {
  const indices = Array.from({ length: n }, (_, i) => i);
  // Fisher–Yates partial shuffle.
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

/** Build the initial non-secret impostor state at game start. */
export function buildImpostorState(
  players: RoomPlayer[],
  category: string,
  impostorCount: number
): ImpostorState {
  const ids = players.map((p) => p.id);
  return {
    phase: "reveal-role",
    order: ids,
    living: [...ids],
    round: 1,
    category,
    impostorCount,
    ready: [],
    clueOrder: [...ids],
    clueIndex: 0,
    clues: [],
    votes: {},
    ejectedId: null,
    ejectedWasImpostor: false,
    revealWord: null,
    result: null,
  };
}

/**
 * Reset state for a NEW clue round over the current living players, keeping
 * seating order. Clears clues/votes and points the clue turn at the first
 * living player.
 */
export function startNextRound(s: ImpostorState): void {
  s.round += 1;
  s.clueOrder = s.order.filter((id) => s.living.includes(id));
  s.clueIndex = 0;
  s.clues = [];
  s.votes = {};
  s.ejectedId = null;
  s.ejectedWasImpostor = false;
  s.phase = "clues";
}

/**
 * Evaluate win conditions among LIVING players.
 *  - "crew": no impostors remain alive.
 *  - "impostors": impostors >= crew among the living (can't be out-voted).
 *  - null: game continues.
 */
export function evaluateWin(
  living: string[],
  impostorIds: Set<string>
): "crew" | "impostors" | null {
  const liveImpostors = living.filter((id) => impostorIds.has(id)).length;
  const liveCrew = living.length - liveImpostors;
  if (liveImpostors === 0) return "crew";
  if (liveImpostors >= liveCrew) return "impostors";
  return null;
}

/** True if `text` duplicates an already-given clue this round (case-insensitive). */
export function isDuplicateClue(
  clues: { text: string }[],
  text: string
): boolean {
  const norm = text.trim().toLowerCase();
  return clues.some((c) => c.text.trim().toLowerCase() === norm);
}

/**
 * Tally votes -> the ejected player id, or null on a tie (ties favor the
 * impostors, so no one is ejected). `votes` is voterId -> suspectId.
 */
export function tallyVotes(votes: Record<string, string>): string | null {
  const counts: Record<string, number> = {};
  for (const suspect of Object.values(votes)) {
    counts[suspect] = (counts[suspect] ?? 0) + 1;
  }
  let top: string | null = null;
  let topN = 0;
  let tie = false;
  for (const [suspect, n] of Object.entries(counts)) {
    if (n > topN) {
      top = suspect;
      topN = n;
      tie = false;
    } else if (n === topN) {
      tie = true;
    }
  }
  return tie ? null : top;
}
