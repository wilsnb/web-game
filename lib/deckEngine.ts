import type { DeckCard } from "./deckTypes";

/**
 * Deck engine for the prompt-based party games. Pure + deterministic given a
 * seed, so the order is stable across re-renders until the player reshuffles.
 * No scoring — these are social games; you just flip through the stack.
 */

/** Seeded Fisher–Yates shuffle (stable for a given seed). */
export function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    // LCG step — same generator used elsewhere in the app for stable shuffles.
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * For Truth or Dare: pick a random card of the requested kind from the deck,
 * avoiding the most recently shown one when possible so it doesn't repeat
 * back-to-back.
 */
export function pickByKind(
  cards: DeckCard[],
  kind: "truth" | "dare",
  seed: number,
  avoidIndex: number | null
): number {
  const indices = cards
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => (c as { kind?: string }).kind === kind)
    .map(({ i }) => i);

  if (indices.length === 0) return -1;
  if (indices.length === 1) return indices[0];

  let s = (seed || 1) * 2654435761;
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  let choice = indices[s % indices.length];
  if (choice === avoidIndex) {
    // Nudge to the next one in the list to avoid an immediate repeat.
    const pos = indices.indexOf(choice);
    choice = indices[(pos + 1) % indices.length];
  }
  return choice;
}
