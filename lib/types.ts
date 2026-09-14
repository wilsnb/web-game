export interface QuizEntry {
  rank: number;
  answer: string;
  aliases: string[];
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  listLength: number;
  source: string;
  /** One-line description shown on cards. */
  description: string;
  /** Path to a representative thumbnail image (served from /public). */
  thumbnail: string;
  list: QuizEntry[];
}

/** A quiz stripped of its answers — safe to hand to the browser/homepage. */
export interface QuizSummary {
  id: string;
  title: string;
  category: string;
  listLength: number;
  source: string;
  description: string;
  thumbnail: string;
}
