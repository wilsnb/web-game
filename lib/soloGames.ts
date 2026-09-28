/**
 * Registry of solo skill/brain games. These are single-player, score-based
 * mini-games (not quizzes, not decks). The /play/[id] route uses this to know
 * an id is a solo game and which title/description to show.
 */
export interface SoloGameMeta {
  id: string;
  title: string;
  description: string;
}

export const SOLO_GAMES: SoloGameMeta[] = [
  {
    id: "reaction-time-test",
    title: "Reaction Time Test",
    description: "Tap the moment the screen turns green — how quick are you?",
  },
  {
    id: "speed-math-challenge",
    title: "Speed Math Challenge",
    description: "Solve as many problems as you can in 60 seconds.",
  },
  {
    id: "memory-sequence",
    title: "Memory Sequence",
    description: "Repeat the growing pattern without a slip.",
  },
  {
    id: "logic-pattern-puzzle",
    title: "Logic & Pattern Puzzle",
    description: "Spot the pattern, pick the answer.",
  },
  {
    id: "higher-or-lower",
    title: "Higher or Lower",
    description: "Guess which has more — keep your streak alive.",
  },
  {
    id: "odd-one-out",
    title: "Odd One Out",
    description: "Four things, one doesn't belong. Spot it.",
  },
];

export function isSoloGameId(id: string): boolean {
  return SOLO_GAMES.some((g) => g.id === id);
}

export function getSoloGameById(id: string): SoloGameMeta | undefined {
  return SOLO_GAMES.find((g) => g.id === id);
}

export function getAllSoloGameIds(): string[] {
  return SOLO_GAMES.map((g) => g.id);
}
