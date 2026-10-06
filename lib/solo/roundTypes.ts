import type { ReactNode } from "react";

/**
 * Round-based solo game model. Every solo game is now 10 rounds × 10 seconds.
 * Each round presents one question/challenge; a correct answer earns points
 * that scale with how fast you answered. This model is shared by solo play and
 * online "race" play (where rounds are synchronized across devices).
 */

export const ROUNDS = 10;
export const ROUND_SECONDS = 10;
/** Seconds the per-round reveal shows before auto-advancing (manual skip too). */
export const REVEAL_SECONDS = 15;

/** Max points for an instant correct answer; decays to a floor over the round. */
export const ROUND_MAX_POINTS = 100;
export const ROUND_MIN_POINTS = 10;

/**
 * Speed-weighted score for a correct answer. `elapsedMs` is how long into the
 * round the answer came (0 = instant). Linearly decays MAX→MIN across the
 * round window. Wrong/no answer should score 0 (caller decides).
 */
export function speedScore(elapsedMs: number): number {
  const frac = Math.min(1, Math.max(0, elapsedMs / (ROUND_SECONDS * 1000)));
  return Math.round(
    ROUND_MAX_POINTS - frac * (ROUND_MAX_POINTS - ROUND_MIN_POINTS)
  );
}

/** The result of a single round for one player. */
export interface RoundResult {
  /** Was the answer correct (for Reaction, whether a valid tap landed). */
  correct: boolean;
  /** Points earned this round (speed-weighted; 0 if wrong/timeout). */
  points: number;
  /** A short human label of what they answered, for the reveal (optional). */
  answerLabel?: string;
}

/**
 * A game-specific "round provider". The engine owns the timer, scoring, reveal,
 * and round advancement; the provider owns the content + how a round renders.
 *
 * `R` is the provider's per-round data (e.g. a puzzle, a math problem, a pair).
 */
export interface RoundProvider<R> {
  gameId: string;
  title: string;
  category: string;
  howToPlay: string;

  /**
   * Build round `index` (0-based) deterministically from `seed`. Same seed +
   * index must always yield the same round so all players match.
   */
  getRound(index: number, seed: number): R;

  /**
   * Render the round. `onAnswer(result)` is called when the player answers
   * (the engine also auto-submits a miss at timeout). `locked` is true once an
   * answer is in / the round ended — render the chosen/correct state then.
   * `remainingMs` lets the UI show per-round time if it wants.
   */
  render(args: {
    round: R;
    onAnswer: (result: RoundResult) => void;
    locked: boolean;
    remainingMs: number;
    /** ms since this round's timer began — use for speed scoring. */
    elapsedMs: () => number;
  }): ReactNode;

  /**
   * Optional: Memory needs a lead-in (show the pattern) before the timed input
   * window starts. Return ms to delay the timer; the provider renders the
   * lead-in itself during `render` based on `remainingMs < 0` ... (kept simple:
   * most games return 0).
   */
  preRoundMs?(round: R): number;
}
