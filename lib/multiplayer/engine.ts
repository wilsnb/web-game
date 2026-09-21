import type { Quiz } from "@/lib/types";
import { findMatchingEntry } from "@/lib/matching";
import { pointsForRank } from "@/lib/scoring";
import type { RoomGame } from "./room";

/**
 * Server-authoritative multiplayer game engine.
 *
 * Reuses the EXACT single-device rules — findMatchingEntry (fuzzy matching),
 * pointsForRank (listLength + 1 - rank), claimed answers, and strict turn
 * rotation — but operates on the shared RoomGame so every player stays in sync.
 *
 * All functions return a NEW game object (never mutate the input) and set
 * `finished` when the game is over.
 */

export interface ApplyResult {
  game: RoomGame;
  finished: boolean;
}

/**
 * Advance the turn in strict rotation:
 *   p0 g1 -> p1 g1 -> ... -> pN g1 -> p0 g2 -> ... -> pN gG, then next round.
 * Returns the updated turn fields + whether the game is now finished.
 */
function advanceTurn(game: RoomGame): {
  currentIndex: number;
  round: number;
  guessNumber: number;
  finished: boolean;
} {
  const count = game.order.length;
  const isLastPlayer = game.currentIndex === count - 1;

  if (!isLastPlayer) {
    return {
      currentIndex: game.currentIndex + 1,
      round: game.round,
      guessNumber: game.guessNumber,
      finished: false,
    };
  }

  // Wrapped to the first player: bump the guess number.
  const nextGuess = game.guessNumber + 1;
  if (nextGuess <= game.guessesPerRound) {
    return { currentIndex: 0, round: game.round, guessNumber: nextGuess, finished: false };
  }

  // Finished all guesses this round: next round.
  const nextRound = game.round + 1;
  if (nextRound <= game.rounds) {
    return { currentIndex: 0, round: nextRound, guessNumber: 1, finished: false };
  }

  // No more rounds — game over.
  return {
    currentIndex: game.currentIndex,
    round: game.round,
    guessNumber: game.guessNumber,
    finished: true,
  };
}

/** The player id whose turn it currently is. */
export function currentPlayerId(game: RoomGame): string {
  return game.order[game.currentIndex];
}

/** Apply a guess by the current player. Assumes turn was already validated. */
export function applyGuess(
  game: RoomGame,
  quiz: Quiz,
  guess: string
): ApplyResult {
  const playerId = currentPlayerId(game);
  const player = game.scores.find((s) => s.playerId === playerId);
  const playerName = player?.name ?? "Player";

  const match = findMatchingEntry(guess, quiz.list);

  let scores = game.scores;
  let claimedRanks = game.claimedRanks;
  let totalFound = game.totalFound;

  const historyBase = {
    id: game.history.length,
    playerId,
    playerName,
    guess,
  };
  let historyEntry;

  if (match && !game.claimedRanks.includes(match.rank)) {
    const points = pointsForRank(match.rank, quiz.listLength);
    scores = game.scores.map((s) =>
      s.playerId === playerId ? { ...s, score: s.score + points } : s
    );
    claimedRanks = [...game.claimedRanks, match.rank];
    totalFound = game.totalFound + 1;
    historyEntry = {
      ...historyBase,
      correct: true,
      matchedAnswer: match.answer,
      matchedRank: match.rank,
      points,
    };
  } else if (match) {
    historyEntry = {
      ...historyBase,
      correct: false,
      alreadyClaimed: true,
      matchedAnswer: match.answer,
    };
  } else {
    historyEntry = { ...historyBase, correct: false };
  }

  const turn = advanceTurn(game);
  const nextGame: RoomGame = {
    ...game,
    scores,
    claimedRanks,
    totalFound,
    history: [...game.history, historyEntry],
    currentIndex: turn.currentIndex,
    round: turn.round,
    guessNumber: turn.guessNumber,
    // Reset the per-turn deadline for the next player (unless the game ended).
    turnEndsAt: turn.finished
      ? game.turnEndsAt
      : Date.now() + game.turnSeconds * 1000,
  };

  return { game: nextGame, finished: turn.finished };
}

/** Apply a skip/pass by the current player. */
export function applySkip(game: RoomGame): ApplyResult {
  const playerId = currentPlayerId(game);
  const player = game.scores.find((s) => s.playerId === playerId);
  const playerName = player?.name ?? "Player";

  const turn = advanceTurn(game);
  const nextGame: RoomGame = {
    ...game,
    history: [
      ...game.history,
      { id: game.history.length, playerId, playerName, guess: "", correct: false, skipped: true },
    ],
    currentIndex: turn.currentIndex,
    round: turn.round,
    guessNumber: turn.guessNumber,
    turnEndsAt: turn.finished
      ? game.turnEndsAt
      : Date.now() + game.turnSeconds * 1000,
  };

  return { game: nextGame, finished: turn.finished };
}
