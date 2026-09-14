import type { QuizSummary } from "./types";

export interface CategoryGroup {
  /** Raw category value from the quiz JSON (e.g. "internet"). */
  category: string;
  /** URL-/DOM-safe anchor id (e.g. "category-internet"). */
  slug: string;
  /** Human label for display (e.g. "Internet"). */
  label: string;
  quizzes: QuizSummary[];
}

/** DOM/anchor-safe slug for a category value. Pure — safe on client and server. */
export function categorySlug(category: string): string {
  return (
    "category-" +
    category
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/** Title-case a raw category for display. */
export function categoryLabel(category: string): string {
  return category
    .split(/[\s_-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Group quiz summaries by their `category` field, deduplicated and sorted.
 * Derived entirely from the data — no hardcoded category list.
 */
export function groupByCategory(quizzes: QuizSummary[]): CategoryGroup[] {
  const map = new Map<string, QuizSummary[]>();
  for (const quiz of quizzes) {
    const list = map.get(quiz.category) ?? [];
    list.push(quiz);
    map.set(quiz.category, list);
  }

  return [...map.entries()]
    .map(([category, list]) => ({
      category,
      slug: categorySlug(category),
      label: categoryLabel(category),
      quizzes: list.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
