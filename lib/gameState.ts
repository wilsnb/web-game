import type { Quiz, QuizEntry } from "./types";
import { findMatchingEntry } from "./matching";
import { pointsForRank } from "./scoring";

export interface Team {
  id: number;
  name: string;
  score: number;
}

export interface GameSettings {
  teamNames: string[]; // 1-7
  rounds: number; // 1-10
  guessesPerRound: number; // 1-10 (per team, per round)
  timerEnabled: boolean;
  timerSeconds: number; // per-guess limit when enabled
}

export type GamePhase = "playing" | "finished";

/** Record of the most recent guess, for feedback (correct/wrong only — no hints). */
export interface LastGuess {
  teamId: number;
  guess: string;
  correct: boolean;
  // On a correct guess we reveal what was matched + points earned.
  matchedAnswer?: string;
  matchedRank?: number;
  points?: number;
  // Set when a correct-but-already-claimed entry was guessed.
  alreadyClaimed?: boolean;
}

export interface GameState {
  phase: GamePhase;
  teams: Team[];
  // Turn tracking
  currentTeamIndex: number; // index into teams
  round: number; // 1-based
  guessNumber: number; // 1-based, within the round (per team)
  // Which ranks have been claimed (scored) already.
  claimedRanks: number[];
  totalFound: number;
  lastGuess: LastGuess | null;
}

export interface InitArgs {
  quiz: Quiz;
  settings: GameSettings;
}

export type GameAction =
  | { type: "SUBMIT_GUESS"; guess: string }
  | { type: "SKIP_GUESS" } // used when timer expires or a team passes
  | { type: "RESET" };

/**
 * Build the initial state. teamNames drives the number of teams.
 */
export function createInitialState(quiz: Quiz, settings: GameSettings): GameState {
  const teams: Team[] = settings.teamNames.map((name, i) => ({
    id: i,
    name: name.trim() || `Team ${i + 1}`,
    score: 0,
  }));

  return {
    phase: "playing",
    teams,
    currentTeamIndex: 0,
    round: 1,
    guessNumber: 1,
    claimedRanks: [],
    totalFound: 0,
    lastGuess: null,
  };
}

/**
 * Advance turn in strict rotation. Turns rotate regardless of correctness.
 *
 * With T teams and G guesses/round, one round is T*G individual turns:
 *   Team0 g1 -> Team1 g1 -> ... -> TeamN g1 -> Team0 g2 -> ... -> TeamN gG
 * After the last team's last guess of the last round, the game finishes.
 */
function advanceTurn(
  state: GameState,
  settings: GameSettings
): Pick<GameState, "currentTeamIndex" | "round" | "guessNumber" | "phase"> {
  const teamCount = state.teams.length;
  const isLastTeamInRotation = state.currentTeamIndex === teamCount - 1;

  if (!isLastTeamInRotation) {
    // Same guess number, next team.
    return {
      currentTeamIndex: state.currentTeamIndex + 1,
      round: state.round,
      guessNumber: state.guessNumber,
      phase: "playing",
    };
  }

  // Wrapped back to the first team: advance the guess number.
  const nextGuessNumber = state.guessNumber + 1;
  if (nextGuessNumber <= settings.guessesPerRound) {
    return {
      currentTeamIndex: 0,
      round: state.round,
      guessNumber: nextGuessNumber,
      phase: "playing",
    };
  }

  // Finished all guesses for this round: advance the round.
  const nextRound = state.round + 1;
  if (nextRound <= settings.rounds) {
    return {
      currentTeamIndex: 0,
      round: nextRound,
      guessNumber: 1,
      phase: "playing",
    };
  }

  // No more rounds: the game is over.
  return {
    currentTeamIndex: state.currentTeamIndex,
    round: state.round,
    guessNumber: state.guessNumber,
    phase: "finished",
  };
}

/**
 * Pure reducer. Needs the quiz (for matching + scoring) and settings (for turn math).
 * We curry those in from the component via a closure.
 */
export function makeReducer(quiz: Quiz, settings: GameSettings) {
  return function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case "RESET":
        return createInitialState(quiz, settings);

      case "SKIP_GUESS": {
        if (state.phase !== "playing") return state;
        const currentTeam = state.teams[state.currentTeamIndex];
        const turn = advanceTurn(state, settings);
        return {
          ...state,
          ...turn,
          lastGuess: {
            teamId: currentTeam.id,
            guess: "",
            correct: false,
          },
        };
      }

      case "SUBMIT_GUESS": {
        if (state.phase !== "playing") return state;

        const currentTeam = state.teams[state.currentTeamIndex];
        const match: QuizEntry | null = findMatchingEntry(
          action.guess,
          quiz.list
        );

        let teams = state.teams;
        let claimedRanks = state.claimedRanks;
        let totalFound = state.totalFound;
        let lastGuess: LastGuess;

        if (match && !state.claimedRanks.includes(match.rank)) {
          // Correct, unclaimed => score it and claim it.
          const points = pointsForRank(match.rank, quiz.listLength);
          teams = state.teams.map((t) =>
            t.id === currentTeam.id ? { ...t, score: t.score + points } : t
          );
          claimedRanks = [...state.claimedRanks, match.rank];
          totalFound = state.totalFound + 1;
          lastGuess = {
            teamId: currentTeam.id,
            guess: action.guess,
            correct: true,
            matchedAnswer: match.answer,
            matchedRank: match.rank,
            points,
          };
        } else if (match) {
          // Correct entity but already claimed => no points, no new claim.
          lastGuess = {
            teamId: currentTeam.id,
            guess: action.guess,
            correct: false,
            alreadyClaimed: true,
            matchedAnswer: match.answer,
          };
        } else {
          // Wrong. No hints, no partial credit.
          lastGuess = {
            teamId: currentTeam.id,
            guess: action.guess,
            correct: false,
          };
        }

        const turn = advanceTurn(state, settings);

        return {
          ...state,
          teams,
          claimedRanks,
          totalFound,
          lastGuess,
          ...turn,
        };
      }

      default:
        return state;
    }
  };
}

/** Teams sorted highest-to-lowest for the scoreboard/results. */
export function rankedTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => b.score - a.score);
}

/** Winner(s): all teams tied at the top score. */
export function winners(teams: Team[]): Team[] {
  if (teams.length === 0) return [];
  const top = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === top);
}
