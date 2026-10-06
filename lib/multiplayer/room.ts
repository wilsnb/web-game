/**
 * Multiplayer room types + helpers (proof-of-concept stage).
 *
 * A room lives as one row in the `rooms` table. Its `state` column (jsonb) is
 * the single shared source of truth that Supabase Realtime streams to every
 * player in the room. For the POC, state is just a synced counter + players.
 */

export interface RoomPlayer {
  /** Stable id: the auth user id for logged-in players, or a random id for guests. */
  id: string;
  name: string;
  isHost: boolean;
  isGuest: boolean;
}

/** Per-player score within a running multiplayer game. */
export interface RoomScore {
  playerId: string;
  name: string;
  score: number;
}

/** One entry in the shared guess history (mirrors single-device history). */
export interface RoomHistoryEntry {
  id: number;
  playerId: string;
  playerName: string;
  guess: string;
  correct: boolean;
  matchedAnswer?: string;
  matchedRank?: number;
  points?: number;
  alreadyClaimed?: boolean;
  skipped?: boolean;
}

/** The running game inside a room (only present once phase is playing/finished). */
export interface RoomGame {
  rounds: number;
  guessesPerRound: number;
  /** Turn order = player ids in join order. */
  order: string[];
  currentIndex: number; // index into order
  round: number; // 1-based
  guessNumber: number; // 1-based within round, per player
  scores: RoomScore[];
  claimedRanks: number[];
  totalFound: number;
  history: RoomHistoryEntry[];
  /** Seconds allowed per turn. */
  turnSeconds: number;
  /** Epoch ms when the current turn auto-skips. Refreshed on every turn change. */
  turnEndsAt: number;
}

/**
 * One player's standing in a round-based solo-race. `total` is the cumulative
 * score; `rounds[i]` holds their result for round i (absent until they answer).
 */
export interface RoomSoloResult {
  playerId: string;
  name: string;
  total: number;
  /** Per-round outcomes, index = round number. */
  rounds: { correct: boolean; points: number }[];
  /** True once this player has submitted an answer for the current round. */
  answeredCurrent: boolean;
}

/**
 * NON-SECRET impostor-game state (safe to stream to everyone). The secret
 * role assignment (who is the impostor + the words) lives server-side in the
 * `room_secrets` table and is NEVER placed here.
 */
export interface ImpostorState {
  /** Sub-phase within the impostor game. */
  phase:
    | "reveal-role" // each player privately views their card, then readies up
    | "clues" // players type one clue each, in turn order
    | "voting" // everyone votes for a suspect
    | "ejection" // show who was voted out + whether they were an impostor
    | "impostor-guess" // an ejected impostor's one shot at the real word
    | "results"; // final reveal + winner
  /** Seating order = all player ids (join order); fixed for the whole game. */
  order: string[];
  /** Players still in the game (not yet ejected). Ejected players spectate. */
  living: string[];
  /** 1-based round number (increments each clue→vote→ejection cycle). */
  round: number;
  /** The category hint shown to everyone (not the word itself). */
  category: string;
  /** How many impostors are in this game (1, or 2 for 6+ players). */
  impostorCount: number;
  /** Players who've tapped "Ready" on the role-reveal screen. */
  ready: string[];
  /** This round's clue turn order (living players, in seating order). */
  clueOrder: string[];
  /** Whose turn it is to give a clue (index into clueOrder). */
  clueIndex: number;
  /** Clues submitted THIS round, in order given. */
  clues: { playerId: string; name: string; text: string }[];
  /** Votes this round: voterId -> suspectId. */
  votes: Record<string, string>;
  /** Who was ejected after voting (null = tie/no ejection). */
  ejectedId: string | null;
  /** Whether the ejected player was an impostor (revealed at ejection). */
  ejectedWasImpostor: boolean;
  /** The real group word, revealed only at results (or on impostor guess). */
  revealWord: string | null;
  /** Final outcome once decided. */
  result: null | {
    winner: "crew" | "impostors";
    reason: string;
    /** All roles, revealed at the end. */
    roles: { playerId: string; name: string; wasImpostor: boolean }[];
  };
}

/** Room shared state — the single source of truth streamed to all players. */
export interface RoomState {
  phase: "lobby" | "playing" | "finished";
  /**
   * Room mode. Absent on legacy rooms, which are all trivia — treat a missing
   * `mode` as "trivia" everywhere for backward compatibility.
   */
  mode?: "trivia" | "solo-race" | "impostor";
  players: RoomPlayer[];
  quizId: string;
  /** Settings the host chose (used when the game starts). */
  settings: { rounds: number; guessesPerRound: number; turnSeconds: number };
  /** POC counter — kept harmlessly; unused once the game runs. */
  counter: number;
  /** The live game; null while in the lobby. */
  game: RoomGame | null;

  // --- Solo-race mode only (round-synchronized) ---
  /** Which solo game is being raced. */
  soloGameId?: string;
  /** Shared seed so every player faces the identical challenge. */
  seed?: number;
  /** Per-player standings for the live leaderboard. */
  soloResults?: RoomSoloResult[];
  /** 0-based index of the round everyone is currently on. */
  currentRound?: number;
  /** Round sub-phase: "playing" (answering) or "reveal" (showing results). */
  roundPhase?: "playing" | "reveal";

  // --- Impostor mode only (non-secret state; roles live in room_secrets) ---
  impostor?: ImpostorState;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  quizId: string;
  state: RoomState;
  createdAt: string;
}

/** Ambiguous-character-free alphabet for readable join codes. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 4;

/** Generate a short, readable join code like "X7K2". */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalize user-typed codes (uppercase, trim, strip spaces). */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "").trim();
}

export function isValidCode(raw: string): boolean {
  const c = normalizeCode(raw);
  return c.length === ROOM_CODE_LENGTH && [...c].every((ch) => CODE_ALPHABET.includes(ch));
}

/** A fresh guest player id (client-side; not an auth user). */
export function newGuestId(): string {
  return "guest_" + Math.random().toString(36).slice(2, 10);
}

export const MP_MIN_ROUNDS = 1;
export const MP_MAX_ROUNDS = 10;
export const MP_MIN_GUESSES = 1;
export const MP_MAX_GUESSES = 10;
export const MP_MIN_TURN_SECONDS = 10;
export const MP_MAX_TURN_SECONDS = 120;

/** Initial shared state for a new trivia room (lobby). */
export function initialRoomState(
  host: RoomPlayer,
  quizId: string,
  settings: { rounds: number; guessesPerRound: number; turnSeconds: number }
): RoomState {
  return {
    phase: "lobby",
    mode: "trivia",
    players: [host],
    quizId,
    settings,
    counter: 0,
    game: null,
  };
}

/**
 * Initial shared state for a new solo-race room (lobby). Everyone will play the
 * same solo game with the shared `seed` so the challenge is identical.
 */
export function initialSoloRoomState(
  host: RoomPlayer,
  soloGameId: string,
  seed: number
): RoomState {
  return {
    phase: "lobby",
    mode: "solo-race",
    players: [host],
    // Reuse quizId as the generic content id so existing columns/queries work.
    quizId: soloGameId,
    soloGameId,
    seed,
    settings: { rounds: 1, guessesPerRound: 1, turnSeconds: 0 },
    counter: 0,
    game: null,
    soloResults: [],
    currentRound: 0,
    roundPhase: "playing",
  };
}

/** Minimum players to start an impostor game, and when a 2nd impostor is added. */
export const MP_IMPOSTOR_MIN_PLAYERS = 3;
export const MP_IMPOSTOR_TWO_AT = 6;

/** The content id used for impostor rooms (stored in quiz_id). */
export const IMPOSTOR_GAME_ID = "who-is-the-impostor";

/** Initial shared state for a new impostor room (lobby). */
export function initialImpostorRoomState(host: RoomPlayer): RoomState {
  return {
    phase: "lobby",
    mode: "impostor",
    players: [host],
    quizId: IMPOSTOR_GAME_ID,
    settings: { rounds: 1, guessesPerRound: 1, turnSeconds: 0 },
    counter: 0,
    game: null,
  };
}

/**
 * Build the initial running game from the lobby's players + settings.
 * Turn order follows join order. Server-authoritative — created only by the
 * start-game route.
 */
export function buildRoomGame(
  players: RoomPlayer[],
  settings: { rounds: number; guessesPerRound: number; turnSeconds: number }
): RoomGame {
  return {
    rounds: settings.rounds,
    guessesPerRound: settings.guessesPerRound,
    order: players.map((p) => p.id),
    currentIndex: 0,
    round: 1,
    guessNumber: 1,
    scores: players.map((p) => ({ playerId: p.id, name: p.name, score: 0 })),
    claimedRanks: [],
    totalFound: 0,
    history: [],
    turnSeconds: settings.turnSeconds,
    turnEndsAt: Date.now() + settings.turnSeconds * 1000,
  };
}
