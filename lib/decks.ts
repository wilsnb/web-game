import fs from "node:fs";
import path from "node:path";
import type { Deck, DeckSummary } from "./deckTypes";

const DECK_DIR = path.join(process.cwd(), "data", "decks");

/** Read and parse every deck JSON file. Server-only (uses fs). */
export function getAllDecks(): Deck[] {
  if (!fs.existsSync(DECK_DIR)) return [];
  const files = fs.readdirSync(DECK_DIR).filter((f) => f.endsWith(".json"));

  const decks = files.map((file) => {
    const raw = fs.readFileSync(path.join(DECK_DIR, file), "utf-8");
    return JSON.parse(raw) as Deck;
  });

  return decks.sort((a, b) => a.title.localeCompare(b.title));
}

/** Card-free summaries for listing surfaces. */
export function getAllDeckSummaries(): DeckSummary[] {
  return getAllDecks().map(
    ({ id, title, category, type, description, thumbnail, cards }) => ({
      id,
      title,
      category,
      type,
      description,
      thumbnail,
      cardCount: cards.length,
    })
  );
}

export function getDeckById(id: string): Deck | undefined {
  return getAllDecks().find((d) => d.id === id);
}

export function getAllDeckIds(): string[] {
  return getAllDecks().map((d) => d.id);
}
