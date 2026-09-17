"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/gameState";
import { rankedTeams, winners } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { PrimaryButton, SecondaryLink } from "./Buttons";

export function ResultsScreen({
  quiz,
  state,
  isSignedIn = false,
  onReplay,
}: {
  quiz: Quiz;
  state: GameState;
  isSignedIn?: boolean;
  onReplay?: () => void;
}) {
  const sorted = rankedTeams(state.teams);
  const topTeams = winners(state.teams);
  const isTie = topTeams.length > 1;
  const winnerLabel = isTie
    ? topTeams.map((t) => t.name).join(" & ")
    : topTeams[0]?.name;

  // Save this finished game's result once (no-op for guests; server-gated).
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    fetch("/api/save-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: quiz.id,
        quizTitle: quiz.title,
        teams: state.teams.map((t) => ({ name: t.name, score: t.score })),
      }),
    }).catch(() => {
      // Saving is best-effort; never block the results screen on it.
    });
  }, [quiz.id, quiz.title, state.teams]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-tile-1 px-lg py-section text-body-on-dark">
      <div className="w-full max-w-content text-center">
        <p className="text-caption text-body-muted">
          {quiz.title} · {state.totalFound} of {quiz.listLength} found
        </p>
        <h1 className="mt-sm text-display-lg font-semibold tracking-tight text-body-on-dark">
          {isTie ? "It's a tie!" : `${winnerLabel} wins`}
        </h1>
        {!isTie && (
          <p className="mt-sm text-lead font-normal text-body-muted">
            {topTeams[0]?.score} points
          </p>
        )}

        {/* Final scoreboard, dark surface */}
        <ol className="mx-auto mt-xl flex max-w-[420px] flex-col text-left">
          {sorted.map((team, i) => {
            const isWinner = topTeams.some((w) => w.id === team.id);
            return (
              <li
                key={team.id}
                className="flex items-center justify-between border-b border-white/10 py-md last:border-b-0"
              >
                <span className="flex items-center gap-sm">
                  <span className="w-[24px] text-caption tabular-nums text-body-muted">
                    {i + 1}
                  </span>
                  <span
                    className={`text-body-apple ${
                      isWinner
                        ? "font-semibold text-primary-on-dark"
                        : "text-body-on-dark"
                    }`}
                  >
                    {team.name}
                  </span>
                </span>
                <span className="text-body-strong font-semibold text-body-on-dark">
                  {team.score}
                  <span className="ml-xxs text-caption font-normal text-body-muted">
                    pts
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* Reveal the real Top 20 (safe now — game is over). Gated: signed-in
            users see it clearly; guests see it blurred with a login prompt. */}
        {(() => {
          const top = quiz.list
            .filter((e) => e.rank <= 20)
            .sort((a, b) => a.rank - b.rank);
          const foundRanks = top
            .filter((e) => state.claimedRanks.includes(e.rank))
            .map((e) => e.rank);
          const revealNext = `/reveal/${quiz.id}${
            foundRanks.length ? `?found=${foundRanks.join(",")}` : ""
          }`;

          return (
            <div className="mx-auto mt-section w-full max-w-[420px] text-left">
              <h2 className="mb-sm text-center text-caption-strong font-semibold uppercase tracking-wide text-body-muted">
                The actual top {top.length}
              </h2>

              <div className="relative">
                <ol
                  className={`flex flex-col transition-all ${
                    isSignedIn ? "" : "pointer-events-none select-none blur-md"
                  }`}
                  aria-hidden={!isSignedIn}
                >
                  {top.map((entry) => {
                    const found = state.claimedRanks.includes(entry.rank);
                    return (
                      <li
                        key={entry.rank}
                        className="flex items-center gap-sm border-b border-white/10 py-sm last:border-b-0"
                      >
                        <span className="w-[28px] text-caption tabular-nums text-body-muted">
                          #{entry.rank}
                        </span>
                        <span
                          className={`flex-1 text-body-apple ${
                            found
                              ? "font-semibold text-primary-on-dark"
                              : "text-body-on-dark"
                          }`}
                        >
                          {entry.answer}
                        </span>
                        <span className="text-caption text-body-muted">
                          {found ? "found" : "missed"}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {/* Login gate overlay */}
                {!isSignedIn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm text-center">
                    <p className="max-w-[280px] text-body-apple font-semibold text-body-on-dark">
                      Log in to reveal the full top {top.length}
                    </p>
                    <Link
                      href={`/login?next=${encodeURIComponent(revealNext)}`}
                      className="press-scale focus-ring inline-flex items-center justify-center rounded-pill bg-primary px-[22px] py-[11px] text-body-apple text-white no-underline"
                    >
                      Log in to reveal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="mt-section flex flex-col items-center justify-center gap-sm sm:flex-row">
          <PrimaryButton onClick={onReplay} className="min-w-[180px]">
            Play again
          </PrimaryButton>
          <SecondaryLink href="/" className="min-w-[180px] !text-primary-on-dark !border-primary-on-dark">
            Back to categories
          </SecondaryLink>
        </div>
      </div>
    </div>
  );
}
