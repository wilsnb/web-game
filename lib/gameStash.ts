import type { GameState } from "./gameState";

/**
 * Persists a FINISHED game to localStorage so that leaving the page to log in
 * (from the answer reveal or the rating buttons) and coming back restores the
 * exact results screen — instead of restarting the game.
 *
 * Keyed by quiz id. Only the finished state is stashed. Expires after a short
 * window so stale games don't resurface days later.
 */

const PREFIX = "qwardoo:finished-game:";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface Stashed {
  v: 1;
  savedAt: number;
  state: GameState;
}

function key(quizId: string) {
  return `${PREFIX}${quizId}`;
}

export function stashFinishedGame(quizId: string, state: GameState): void {
  if (typeof window === "undefined") return;
  if (state.phase !== "finished") return;
  try {
    const payload: Stashed = { v: 1, savedAt: Date.now(), state };
    window.localStorage.setItem(key(quizId), JSON.stringify(payload));
  } catch {
    // Storage full/blocked — restore is best-effort, ignore.
  }
}

export function loadFinishedGame(quizId: string): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(quizId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stashed;
    if (parsed.v !== 1 || !parsed.state) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key(quizId));
      return null;
    }
    if (parsed.state.phase !== "finished") return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function clearFinishedGame(quizId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(quizId));
  } catch {
    // ignore
  }
}
