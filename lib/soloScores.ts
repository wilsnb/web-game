"use client";

/**
 * Local best-score storage for the solo skill/brain games. Guest-friendly —
 * no backend, no login; the best score lives in the player's browser.
 *
 * Some games are "higher is better" (Speed Math, Memory, Logic) and some are
 * "lower is better" (Reaction Time, in ms), so callers say which they want.
 */

const KEY_PREFIX = "qwardoo:best:";

function key(gameId: string): string {
  return `${KEY_PREFIX}${gameId}`;
}

/** Read the stored best score for a game, or null if none yet. */
export function getBestScore(gameId: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(gameId));
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Save `score` if it beats the stored best. Returns { best, isNewBest }.
 * `higherIsBetter` decides the comparison direction.
 */
export function saveBestScore(
  gameId: string,
  score: number,
  higherIsBetter: boolean
): { best: number; isNewBest: boolean } {
  const current = getBestScore(gameId);
  let isNewBest: boolean;
  if (current === null) {
    isNewBest = true;
  } else if (higherIsBetter) {
    isNewBest = score > current;
  } else {
    isNewBest = score < current;
  }

  const best = isNewBest ? score : (current as number);
  if (isNewBest && typeof window !== "undefined") {
    window.localStorage.setItem(key(gameId), String(score));
  }
  return { best, isNewBest };
}
