"use client";

import { useEffect, useRef, useState } from "react";
import type { GameSettings, GameState } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { Scoreboard } from "./Scoreboard";
import { PrimaryButton } from "./Buttons";

/** Feedback banner for the last guess — correct/wrong only, never a hint. */
function GuessFeedback({ state }: { state: GameState }) {
  const last = state.lastGuess;
  if (!last || last.guess === "") return <div className="h-[52px]" />;

  if (last.correct) {
    return (
      <div className="flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink">
        <span className="font-semibold text-primary">Correct!</span>
        <span className="ml-xs">
          {last.matchedAnswer} was #{last.matchedRank} · +{last.points} pts
        </span>
      </div>
    );
  }

  if (last.alreadyClaimed) {
    return (
      <div className="flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink-muted-80">
        Already found — no points this time.
      </div>
    );
  }

  return (
    <div className="flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink-muted-80">
      Not on the list. No points.
    </div>
  );
}

export function GameBoard({
  quiz,
  settings,
  state,
  onGuess,
  onSkip,
}: {
  quiz: Quiz;
  settings: GameSettings;
  state: GameState;
  onGuess: (guess: string) => void;
  onSkip: () => void;
}) {
  const [guess, setGuess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTeam = state.teams[state.currentTeamIndex];

  // Timer: per-guess, resets whenever the turn changes.
  const [secondsLeft, setSecondsLeft] = useState(settings.timerSeconds);
  const turnKey = `${state.round}-${state.guessNumber}-${state.currentTeamIndex}`;

  useEffect(() => {
    setGuess("");
    inputRef.current?.focus();
    if (!settings.timerEnabled) return;
    setSecondsLeft(settings.timerSeconds);
  }, [turnKey, settings.timerEnabled, settings.timerSeconds]);

  useEffect(() => {
    if (!settings.timerEnabled) return;
    if (state.phase !== "playing") return;
    if (secondsLeft <= 0) {
      onSkip();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, settings.timerEnabled, state.phase, onSkip]);

  function submit() {
    const trimmed = guess.trim();
    if (!trimmed) return;
    onGuess(trimmed);
    setGuess("");
  }

  return (
    <div className="mx-auto w-full max-w-content px-lg py-xl">
      {/* Quiz title — always visible so players remember what they're playing */}
      <div className="mb-lg border-b border-divider-soft pb-md text-center">
        <p className="text-caption capitalize text-ink-muted-48">
          {quiz.category} · Top {quiz.listLength}
        </p>
        <h1 className="mt-xxs text-display-md font-semibold tracking-tight text-ink">
          {quiz.title}
        </h1>
      </div>

      {/* Round / guess status */}
      <div className="mb-lg flex items-center justify-between">
        <span className="text-caption text-ink-muted-48">
          Round {state.round} of {settings.rounds} · Guess {state.guessNumber}{" "}
          of {settings.guessesPerRound}
        </span>
        <span className="text-caption text-ink-muted-48">
          {state.totalFound} of {quiz.listLength} found
        </span>
      </div>

      {/* Progress bar (found out of total — reveals nothing about which) */}
      <div
        className="mb-xl h-[6px] w-full overflow-hidden rounded-pill bg-divider-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={quiz.listLength}
        aria-valuenow={state.totalFound}
      >
        <div
          className="h-full rounded-pill bg-primary transition-all"
          style={{
            width: `${(state.totalFound / quiz.listLength) * 100}%`,
          }}
        />
      </div>

      {/* Current turn hero */}
      <div className="mb-lg text-center">
        <p className="text-caption text-ink-muted-48">Now guessing</p>
        <h2 className="text-display-md font-semibold tracking-tight text-ink">
          {currentTeam.name}
        </h2>
      </div>

      {settings.timerEnabled && (
        <div className="mb-lg text-center">
          <span
            className={`text-tagline font-semibold tabular-nums ${
              secondsLeft <= 5 ? "text-primary" : "text-ink-muted-80"
            }`}
          >
            {secondsLeft}s
          </span>
        </div>
      )}

      {/* Guess input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mb-md flex flex-col gap-sm sm:flex-row"
      >
        <input
          ref={inputRef}
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess…"
          autoComplete="off"
          aria-label={`${currentTeam.name}'s guess`}
          className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink"
        />
        <PrimaryButton type="submit" className="h-[44px]">
          Submit
        </PrimaryButton>
      </form>

      <div className="mb-xl flex justify-center">
        <button
          type="button"
          onClick={onSkip}
          className="focus-ring press-scale text-caption text-primary"
        >
          Pass / skip this guess
        </button>
      </div>

      <GuessFeedback state={state} />

      {/* Running scores */}
      <section className="mt-xl">
        <h3 className="mb-sm text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-48">
          Scores
        </h3>
        <Scoreboard teams={state.teams} currentTeamId={currentTeam.id} />
      </section>
    </div>
  );
}
