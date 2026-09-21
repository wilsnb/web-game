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

/** Room shared state — the single source of truth streamed to all players. */
export interface RoomState {
  phase: "lobby" | "playing" | "finished";
  players: RoomPlayer[];
  quizId: string;
  /** Settings the host chose (used when the game starts). */
  settings: { rounds: number; guessesPerRound: number; turnSeconds: number };
  /** POC counter — kept harmlessly; unused once the game runs. */
  counter: number;
  /** The live game; null while in the lobby. */
  game: RoomGame | null;
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

/** Initial shared state for a new room (lobby). */
export function initialRoomState(
  host: RoomPlayer,
  quizId: string,
  settings: { rounds: number; guessesPerRound: number; turnSeconds: number }
): RoomState {
  return {
    phase: "lobby",
    players: [host],
    quizId,
    settings,
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
