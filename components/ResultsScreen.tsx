"use client";

import type { GameState } from "@/lib/gameState";
import { rankedTeams, winners } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { PrimaryButton, SecondaryLink } from "./Buttons";

export function ResultsScreen({
  quiz,
  state,
  onReplay,
}: {
  quiz: Quiz;
  state: GameState;
  onReplay: () => void;
}) {
  const sorted = rankedTeams(state.teams);
  const topTeams = winners(state.teams);
  const isTie = topTeams.length > 1;
  const winnerLabel = isTie
    ? topTeams.map((t) => t.name).join(" & ")
    : topTeams[0]?.name;

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
