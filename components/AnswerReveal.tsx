"use client";

import Link from "next/link";
import { useState } from "react";

export interface RevealEntry {
  rank: number;
  answer: string;
  found: boolean;
}

/**
 * Post-game answer reveal (Option A): the top-20 list ALWAYS starts blurred.
 *  - Signed in: a "View answers" button lifts the blur on click (never auto).
 *  - Signed out: a "Log in to view answers" button (login is the gate); after
 *    login the player returns here and still clicks "View answers" to reveal.
 */
export function AnswerReveal({
  entries,
  isSignedIn,
  loginNext,
}: {
  entries: RevealEntry[];
  isSignedIn: boolean;
  loginNext: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const showClear = isSignedIn && revealed;

  return (
    <div className="mx-auto mt-section w-full max-w-[420px] text-left">
      <h2 className="mb-sm text-center text-caption-strong font-semibold uppercase tracking-wide text-body-muted">
        The actual top {entries.length}
      </h2>

      <div className="relative">
        <ol
          className={`flex flex-col transition-all ${
            showClear ? "" : "pointer-events-none select-none blur-md"
          }`}
          aria-hidden={!showClear}
        >
          {entries.map((entry) => (
            <li
              key={entry.rank}
              className="flex items-center gap-sm border-b border-white/10 py-sm last:border-b-0"
            >
              <span className="w-[28px] text-caption tabular-nums text-body-muted">
                #{entry.rank}
              </span>
              <span
                className={`flex-1 text-body-apple ${
                  entry.found
                    ? "font-semibold text-primary-on-dark"
                    : "text-body-on-dark"
                }`}
              >
                {entry.answer}
              </span>
              <span className="text-caption text-body-muted">
                {entry.found ? "found" : "missed"}
              </span>
            </li>
          ))}
        </ol>

        {/* Overlay: shown until the answers are revealed. */}
        {!showClear && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm text-center">
            {isSignedIn ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="press-scale focus-ring inline-flex items-center justify-center rounded-pill bg-primary px-[22px] py-[11px] text-body-apple text-white"
              >
                View answers
              </button>
            ) : (
              <>
                <p className="max-w-[280px] text-body-apple font-semibold text-body-on-dark">
                  Log in to view the answers
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(loginNext)}`}
                  className="press-scale focus-ring inline-flex items-center justify-center rounded-pill bg-primary px-[22px] py-[11px] text-body-apple text-white no-underline"
                >
                  Log in to view answers
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
