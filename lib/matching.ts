import type { QuizEntry } from "./types";

/**
 * Answer matching: fuzzy + typo-tolerant, with a strict trailing-number rule.
 *
 * Rules:
 *  - Case-insensitive.
 *  - Normalize by stripping non-alphanumeric chars ("AT&T" -> "atnt").
 *  - Tolerate small typos via Levenshtein distance, tolerance scaled to length.
 *  - CRITICAL: if guess and answer have different TRAILING numbers, never fuzzy-match
 *    ("spiderman" matches "Spider-Man" but NOT "Spider-Man 2").
 *  - Aliases are checked with the same rules.
 */

/** Lowercase + strip everything that isn't a letter or digit. */
export function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Extract a trailing integer from the ORIGINAL string (before normalization),
 * so "Spider-Man 2" -> "2", "Avatar" -> null, "Fast 7" -> "7".
 * We read the trailing digits of the raw (trimmed) string.
 */
export function trailingNumber(input: string): string | null {
  const match = input.trim().match(/(\d+)\s*$/);
  return match ? String(parseInt(match[1], 10)) : null;
}

/** Classic Levenshtein edit distance (iterative, O(m*n)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Allowed edit distance, scaled to the LONGER of the two strings compared.
 *
 * Very short strings (<= 2 chars, e.g. abbreviations like "CA" vs "GA") stay
 * exact so distinct abbreviations never collide. From 3 chars up we allow one
 * edit — this is what lets "att" (from "AT&T") match "atnt". Longer strings
 * tolerate proportionally more typos.
 */
function toleranceFor(maxLength: number): number {
  if (maxLength <= 2) return 0;
  if (maxLength <= 6) return 1;
  if (maxLength <= 12) return 2;
  return 3;
}

/** Does a single guess match a single candidate answer/alias string? */
export function matchesCandidate(guess: string, candidate: string): boolean {
  // Trailing-number guard uses the ORIGINAL strings, not the normalized ones.
  const guessNum = trailingNumber(guess);
  const candidateNum = trailingNumber(candidate);
  if (guessNum !== candidateNum) {
    // Different (or present-vs-absent) trailing numbers => distinct entities.
    return false;
  }

  const g = normalize(guess);
  const c = normalize(candidate);

  if (g.length === 0 || c.length === 0) return false;
  if (g === c) return true;

  const tolerance = toleranceFor(Math.max(g.length, c.length));
  if (tolerance === 0) return false;

  return levenshtein(g, c) <= tolerance;
}

/** Does a guess match a quiz entry (its answer or any alias)? */
export function matchesEntry(guess: string, entry: QuizEntry): boolean {
  if (matchesCandidate(guess, entry.answer)) return true;
  return entry.aliases.some((alias) => matchesCandidate(guess, alias));
}

/**
 * Find the entry a guess matches, if any.
 * Returns the matching entry or null. (Caller decides claimed/scoring.)
 */
export function findMatchingEntry(
  guess: string,
  entries: QuizEntry[]
): QuizEntry | null {
  for (const entry of entries) {
    if (matchesEntry(guess, entry)) return entry;
  }
  return null;
}
