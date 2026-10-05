/**
 * Tiny deterministic PRNG for solo-race mode. Given the room's shared seed,
 * every player's generator produces the identical stream of values — so the
 * challenge (reaction delays, math problems, memory pattern) is the same for
 * everyone. In solo play (no seed) games fall back to Math.random instead.
 *
 * Mulberry32: fast, good-enough distribution for gameplay (not crypto).
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a random source: a seeded generator when `seed` is provided
 * (multiplayer solo-race), else Math.random (solo play). Lets each game use one
 * `rand()` call site regardless of mode.
 */
export function randSource(seed?: number): () => number {
  return typeof seed === "number" ? makeRng(seed) : Math.random;
}
