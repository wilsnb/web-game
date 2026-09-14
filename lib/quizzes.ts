import fs from "node:fs";
import path from "node:path";
import type { Quiz, QuizSummary } from "./types";

const QUIZ_DIR = path.join(process.cwd(), "data", "quizzes");

/** Read and parse every quiz JSON file. Server-only (uses fs). */
export function getAllQuizzes(): Quiz[] {
  const files = fs
    .readdirSync(QUIZ_DIR)
    .filter((f) => f.endsWith(".json"));

  const quizzes = files.map((file) => {
    const raw = fs.readFileSync(path.join(QUIZ_DIR, file), "utf-8");
    return JSON.parse(raw) as Quiz;
  });

  // Stable, readable ordering for the homepage grid.
  return quizzes.sort((a, b) => a.title.localeCompare(b.title));
}

/** Answer-free summaries for the homepage / listing surfaces. */
export function getAllQuizSummaries(): QuizSummary[] {
  return getAllQuizzes().map(
    ({ id, title, category, listLength, source, description, thumbnail }) => ({
      id,
      title,
      category,
      listLength,
      source,
      description,
      thumbnail,
    })
  );
}

export function getQuizById(id: string): Quiz | undefined {
  return getAllQuizzes().find((q) => q.id === id);
}

export function getAllQuizIds(): string[] {
  return getAllQuizzes().map((q) => q.id);
}
