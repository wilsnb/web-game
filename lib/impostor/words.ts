import wordData from "@/data/impostor/words.json";

export interface WordPair {
  category: string;
  /** The word the crew (non-impostors) sees. */
  group: string;
  /** The related decoy the impostor sees. */
  decoy: string;
}

export function getWordPairs(): WordPair[] {
  return wordData.pairs as WordPair[];
}

/** Pick a random word pair using a provided RNG (0..1). */
export function pickWordPair(rand: () => number): WordPair {
  const pairs = getWordPairs();
  return pairs[Math.floor(rand() * pairs.length)];
}
