"use client";

import { useCallback, useMemo, useState } from "react";
import type { QuizSummary } from "@/lib/types";
import { QuizCard } from "./QuizCard";

const RECOMMENDED_COUNT = 4;

function pickRandom<T>(items: T[], count: number, seed: number): T[] {
  // Simple seeded shuffle so re-renders are stable until the seed changes.
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/**
 * "Recommended for you" sidebar panel.
 *  - Header + compact bordered quiz cards.
 *  - "Unplayed only" checkbox (placeholder filter — no play history yet).
 *  - Shuffle button re-rolls the recommendation set.
 */
export function Sidebar({ quizzes }: { quizzes: QuizSummary[] }) {
  const [seed, setSeed] = useState(1);
  const [unplayedOnly, setUnplayedOnly] = useState(false);

  const recommended = useMemo(
    () => pickRandom(quizzes, RECOMMENDED_COUNT, seed),
    [quizzes, seed]
  );

  const shuffle = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  return (
    <aside
      aria-label="Recommended categories"
      className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-haas text-at-title-md font-medium text-at-ink">
          Recommended for you
        </h2>
        <button
          type="button"
          onClick={shuffle}
          className="flex items-center gap-[6px] rounded-at-sm border border-at-hairline bg-at-canvas px-[10px] py-[6px] font-haas text-at-caption text-at-ink transition-all hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-[14px] w-[14px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 5h5l7 10h4M16 3l4 2-4 2M4 15h5l2-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shuffle
        </button>
      </div>

      {/* Unplayed filter — placeholder (no play history tracked yet) */}
      <label className="mt-md flex cursor-pointer items-center gap-xs font-haas text-at-body-md text-at-body">
        <input
          type="checkbox"
          checked={unplayedOnly}
          onChange={(e) => setUnplayedOnly(e.target.checked)}
          className="h-[16px] w-[16px] rounded-at-xs border-at-border-strong text-at-link focus:ring-at-link"
        />
        Unplayed quizzes only
      </label>

      <ul className="mt-md flex flex-col gap-sm">
        {recommended.map((quiz) => (
          <li key={quiz.id}>
            <QuizCard quiz={quiz} compact />
          </li>
        ))}
      </ul>
    </aside>
  );
}
