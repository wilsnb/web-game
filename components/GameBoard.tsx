"use client";

import { useEffect, useRef, useState } from "react";
import type { GameSettings, GameState } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { PrimaryButton } from "./Buttons";

/** Feedback banner for the last guess — correct/wrong only, never a hint. */
function GuessFeedback({ state }: { state: GameState }) {
  const last = state.lastGuess;
  if (!last || last.guess === "") return <div className="h-[52px]" />;

  // Key on the guess count so the banner replays its fade on each new guess.
  const key = state.history.length;

  if (last.correct) {
    return (
      <div
        key={key}
        className="motion-fade flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink"
      >
        <span className="font-semibold text-primary">Correct!</span>
        <span className="ml-xs">
          {last.matchedAnswer} was #{last.matchedRank} · +{last.points} pts
        </span>
      </div>
    );
  }

  if (last.alreadyClaimed) {
    return (
      <div
        key={key}
        className="motion-fade flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink-muted-80"
      >
        Already found — no points this time.
      </div>
    );
  }

  return (
    <div
      key={key}
      className="motion-fade flex h-[52px] items-center justify-center rounded-md bg-pearl px-md text-body-apple text-ink-muted-80"
    >
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
  interactive = true,
  timerNode,
  waitingNode,
  extraControls,
}: {
  quiz: Quiz;
  settings: GameSettings;
  state: GameState;
  onGuess: (guess: string) => void;
  onSkip: () => void;
  /** When false, hide the guess input + skip (e.g. it's not this player's turn). */
  interactive?: boolean;
  /** Custom timer UI (multiplayer passes its shared countdown). */
  timerNode?: React.ReactNode;
  /** Shown in place of the input when not interactive (e.g. "Waiting for X"). */
  waitingNode?: React.ReactNode;
  /** Extra controls under the turn area (e.g. host "skip player"). */
  extraControls?: React.ReactNode;
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
          className="h-full rounded-pill bg-primary transition-all duration-slow ease-soft"
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

      {/* Timer: custom node in multiplayer, else the local per-guess timer. */}
      {timerNode ? (
        <div className="mb-lg">{timerNode}</div>
      ) : (
        settings.timerEnabled && (
          <div className="mb-lg text-center">
            <span
              className={`text-tagline font-semibold tabular-nums ${
                secondsLeft <= 5 ? "text-primary" : "text-ink-muted-80"
              }`}
            >
              {secondsLeft}s
            </span>
          </div>
        )
      )}

      {interactive ? (
        <>
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
              className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink transition-all duration-base ease-soft focus:border-primary"
            />
            <PrimaryButton type="submit" className="h-[44px]">
              Submit
            </PrimaryButton>
          </form>

          <div className="mb-xl flex justify-center">
            <button
              type="button"
              onClick={onSkip}
              className="focus-ring press-scale rounded-pill px-sm py-xxs text-caption text-primary transition-colors duration-fast ease-soft hover:text-primary-focus"
            >
              Pass / skip this guess
            </button>
          </div>
        </>
      ) : (
        <div className="mb-xl flex flex-col items-center gap-sm">
          {waitingNode}
          {extraControls}
        </div>
      )}

      <GuessFeedback state={state} />

      {/* Team blocks — setup order (Team 1 leftmost), current turn highlighted */}
      <section className="mt-xl">
        <h3 className="mb-sm text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-48">
          Scores
        </h3>
        <div className="flex flex-wrap gap-sm">
          {state.teams.map((team) => {
            const isCurrent = team.id === currentTeam.id;
            return (
              <div
                key={team.id}
                className={`min-w-[110px] flex-1 rounded-lg border p-md text-center transition-all duration-base ease-soft ${
                  isCurrent
                    ? "border-primary bg-primary/5 scale-[1.03] shadow-at-card"
                    : "border-divider-soft bg-canvas"
                }`}
              >
                <div
                  className={`truncate text-caption font-semibold ${
                    isCurrent ? "text-primary" : "text-ink-muted-80"
                  }`}
                  title={team.name}
                >
                  {team.name}
                </div>
                <div className="mt-xxs text-display-md font-semibold tabular-nums text-ink">
                  {team.score}
                </div>
                <div className="text-caption text-ink-muted-48">pts</div>
                {isCurrent && (
                  <div className="mt-xxs text-caption font-semibold text-primary">
                    Your turn
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Guess history — whole game, newest first, scrollable */}
      <section className="mt-xl">
        <h3 className="mb-sm text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-48">
          Guess history
        </h3>
        {state.history.length === 0 ? (
          <p className="rounded-md border border-dashed border-divider-soft p-md text-caption text-ink-muted-48">
            No guesses yet. Every guess this game will show up here.
          </p>
        ) : (
          <ul className="flex max-h-[280px] flex-col gap-xs overflow-y-auto pr-xs">
            {[...state.history].reverse().map((h) => (
              <li
                key={h.id}
                className="motion-rise flex items-center justify-between gap-sm rounded-md border border-divider-soft bg-canvas px-md py-sm"
              >
                <span className="flex min-w-0 items-center gap-sm">
                  <span
                    className="w-[84px] flex-none truncate text-caption font-semibold text-ink-muted-80"
                    title={h.teamName}
                  >
                    {h.teamName}
                  </span>
                  <span className="truncate text-body-apple text-ink">
                    {h.skipped ? (
                      <span className="italic text-ink-muted-48">passed</span>
                    ) : (
                      `"${h.guess}"`
                    )}
                  </span>
                </span>
                <span className="flex-none text-caption">
                  {h.correct ? (
                    <span className="font-semibold text-primary">
                      ✓ {h.matchedAnswer} · #{h.matchedRank} · +{h.points}
                    </span>
                  ) : h.alreadyClaimed ? (
                    <span className="text-ink-muted-48">already found</span>
                  ) : h.skipped ? (
                    <span className="text-ink-muted-48">—</span>
                  ) : (
                    <span className="text-ink-muted-48">✗ not on list</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
