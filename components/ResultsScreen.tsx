"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/gameState";
import { rankedTeams, winners } from "@/lib/gameState";
import { clearFinishedGame } from "@/lib/gameStash";
import type { Quiz } from "@/lib/types";
import { PrimaryButton, SecondaryLink } from "./Buttons";
import { RatingButtons } from "./RatingButtons";
import { AnswerReveal } from "./AnswerReveal";

export function ResultsScreen({
  quiz,
  state,
  isSignedIn = false,
  restored = false,
  onReplay,
}: {
  quiz: Quiz;
  state: GameState;
  isSignedIn?: boolean;
  restored?: boolean;
  onReplay?: () => void;
}) {
  const sorted = rankedTeams(state.teams);
  const topTeams = winners(state.teams);
  const isTie = topTeams.length > 1;
  const winnerLabel = isTie
    ? topTeams.map((t) => t.name).join(" & ")
    : topTeams[0]?.name;

  // Save this finished game's result once (no-op for guests; server-gated).
  // On a restored game the player may have just logged in, so this is what
  // finally persists their guest game to their account.
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
    })
      .then(async (res) => {
        // Once a restored game is safely saved for a signed-in user, clear the
        // stash so it can't be re-saved on a later visit.
        if (restored && isSignedIn && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.saved) clearFinishedGame(quiz.id);
        }
      })
      .catch(() => {
        // Saving is best-effort; never block the results screen on it.
      });
  }, [quiz.id, quiz.title, state.teams, restored, isSignedIn]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-tile-1 px-lg py-section text-body-on-dark">
      <div className="motion-rise w-full max-w-content text-center">
        <p className="text-caption text-body-muted">
          {quiz.title} · {state.totalFound} of {quiz.listLength} found
        </p>
        <h1 className="motion-pop mt-sm text-display-lg font-semibold tracking-tight text-body-on-dark">
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
                className="motion-rise flex items-center justify-between border-b border-white/10 py-md last:border-b-0"
                style={{ animationDelay: `${120 + i * 70}ms` }}
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

        {/* Reveal the real Top 20 (safe now — game is over). Always starts
            blurred; a "View answers" click reveals it (signed in), or a login
            prompt (signed out). Login returns to /play/<id> where the stashed
            finished game restores this screen. */}
        <AnswerReveal
          entries={quiz.list
            .filter((e) => e.rank <= 20)
            .sort((a, b) => a.rank - b.rank)
            .map((e) => ({
              rank: e.rank,
              answer: e.answer,
              found: state.claimedRanks.includes(e.rank),
            }))}
          isSignedIn={isSignedIn}
          loginNext={`/play/${quiz.id}`}
          source={quiz.source}
        />

        {/* Rate this game */}
        <div className="mt-section">
          <RatingButtons
            gameId={quiz.id}
            isSignedIn={isSignedIn}
            loginNext={`/play/${quiz.id}`}
          />
        </div>

        <div className="mt-xl flex flex-col items-center justify-center gap-sm sm:flex-row">
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
