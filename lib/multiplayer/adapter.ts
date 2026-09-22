import type { GameSettings, GameState, LastGuess } from "@/lib/gameState";
import type { RoomGame, RoomState } from "./room";

/**
 * Adapts the multiplayer RoomGame (shared, server-authoritative) into the
 * single-device GameState/GameSettings shape so the REAL GameBoard and
 * ResultsScreen can render a multiplayer game unchanged.
 *
 * The two models are near-isomorphic — this is mostly a rename:
 *   scores  -> teams        (playerId string -> team.id numeric index)
 *   currentIndex -> currentTeamIndex
 *   history[].playerId/playerName -> teamId/teamName
 * plus we synthesize `lastGuess` from the newest history entry (the multiplayer
 * state doesn't carry it) so the guess-feedback banner works.
 *
 * Team ids are the player's index in `order`, keeping them numeric as the
 * single-device components expect. A parallel `playerIds` array is returned so
 * callers can map a team index back to the owning player id (for turn gating).
 */
export interface AdaptedGame {
  state: GameState;
  settings: GameSettings;
  /** team index -> owning player id (order-aligned). */
  playerIds: string[];
}

export function adaptRoomGame(
  room: RoomState,
  game: RoomGame
): AdaptedGame {
  // order defines both turn order and the numeric team ids (index).
  const playerIds = game.order;

  const teams = game.order.map((pid, i) => {
    const score = game.scores.find((s) => s.playerId === pid);
    return {
      id: i,
      name: score?.name ?? "Player",
      score: score?.score ?? 0,
    };
  });

  const indexOfPlayer = (pid: string) => playerIds.indexOf(pid);

  const history = game.history.map((h) => ({
    id: h.id,
    teamId: indexOfPlayer(h.playerId),
    teamName: h.playerName,
    guess: h.guess,
    correct: h.correct,
    matchedAnswer: h.matchedAnswer,
    matchedRank: h.matchedRank,
    points: h.points,
    alreadyClaimed: h.alreadyClaimed,
    skipped: h.skipped,
  }));

  // Synthesize lastGuess from the newest history entry.
  const last = game.history[game.history.length - 1];
  let lastGuess: LastGuess | null = null;
  if (last && !last.skipped) {
    lastGuess = {
      teamId: indexOfPlayer(last.playerId),
      guess: last.guess,
      correct: last.correct,
      matchedAnswer: last.matchedAnswer,
      matchedRank: last.matchedRank,
      points: last.points,
      alreadyClaimed: last.alreadyClaimed,
    };
  }

  const state: GameState = {
    phase: room.phase === "finished" ? "finished" : "playing",
    teams,
    currentTeamIndex: game.currentIndex,
    round: game.round,
    guessNumber: game.guessNumber,
    claimedRanks: game.claimedRanks,
    totalFound: game.totalFound,
    lastGuess,
    history,
  };

  // The single-device GameBoard owns its own per-guess timer; in multiplayer
  // the shared turnEndsAt drives the countdown instead, so we mark the timer
  // disabled here and let RoomView render the shared timer separately.
  const settings: GameSettings = {
    teamNames: teams.map((t) => t.name),
    rounds: game.rounds,
    guessesPerRound: game.guessesPerRound,
    timerEnabled: false,
    timerSeconds: game.turnSeconds,
  };

  return { state, settings, playerIds };
}
