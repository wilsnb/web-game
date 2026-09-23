/**
 * Prompt-deck party games (pass-and-play). One engine, many decks — mirrors
 * the trivia quiz setup. Decks are pure content: a shuffled stack of cards you
 * flip through. No scoring; these are social "gather round the phone" games.
 */

/** A two-option card: "Would You Rather" / "This or That". */
export interface TwoOptionCard {
  a: string;
  b: string;
}

/** A single-statement card: "Never Have I Ever". */
export interface StatementCard {
  text: string;
}

/** A Truth or Dare card — a prompt tagged as a truth or a dare. */
export interface TruthOrDareCard {
  text: string;
  kind: "truth" | "dare";
}

export type DeckType = "two-option" | "statement" | "truth-or-dare";

export type DeckCard = TwoOptionCard | StatementCard | TruthOrDareCard;

export interface Deck {
  id: string;
  title: string;
  category: string;
  type: DeckType;
  /** One-line description shown on cards. */
  description: string;
  /** Path to a representative thumbnail image (served from /public). */
  thumbnail: string;
  cards: DeckCard[];
}

/** A deck stripped for listing surfaces (no cards). */
export interface DeckSummary {
  id: string;
  title: string;
  category: string;
  type: DeckType;
  description: string;
  thumbnail: string;
  cardCount: number;
}

// --- Type guards for the card shapes ---

export function isTwoOptionCard(c: DeckCard): c is TwoOptionCard {
  return (c as TwoOptionCard).a !== undefined;
}

export function isTruthOrDareCard(c: DeckCard): c is TruthOrDareCard {
  return (c as TruthOrDareCard).kind !== undefined;
}

export function isStatementCard(c: DeckCard): c is StatementCard {
  return (
    (c as StatementCard).text !== undefined &&
    (c as TruthOrDareCard).kind === undefined
  );
}
