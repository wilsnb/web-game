"use client";

import { useState } from "react";
import type { GameSettings } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { PrimaryButton } from "./Buttons";

const MAX_TEAMS = 7;
const MIN_TEAMS = 1;
const MAX_ROUNDS = 10;
const MAX_GUESSES = 10;

/** Small stepper control (−/value/+) following the pill grammar. */
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-divider-soft py-md">
      <div className="flex flex-col">
        <span className="text-body-apple text-ink">{label}</span>
        {hint && <span className="text-caption text-ink-muted-48">{hint}</span>}
      </div>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full bg-pearl text-body-strong text-ink disabled:text-ink-muted-48"
        >
          −
        </button>
        <span className="w-[32px] text-center text-body-strong font-semibold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full bg-pearl text-body-strong text-ink disabled:text-ink-muted-48"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SetupForm({
  quiz,
  onStart,
}: {
  quiz: Quiz;
  onStart: (settings: GameSettings) => void;
}) {
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
    "Player 5",
    "Player 6",
    "Player 7",
  ]);
  const [rounds, setRounds] = useState(3);
  const [guessesPerRound, setGuessesPerRound] = useState(3);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  function updateName(index: number, name: string) {
    setTeamNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }

  function handleStart() {
    const names = teamNames
      .slice(0, teamCount)
      .map((n, i) => (n.trim() ? n.trim() : `Player ${i + 1}`));
    onStart({
      teamNames: names,
      rounds,
      guessesPerRound,
      timerEnabled,
      timerSeconds,
    });
  }

  return (
    <div className="mx-auto w-full max-w-content px-lg py-section">
      <header className="mb-xl flex flex-col gap-sm">
        <span className="text-caption capitalize text-ink-muted-48">
          {quiz.category} · Top {quiz.listLength}
        </span>
        <h1 className="text-display-lg font-semibold tracking-tight text-ink">
          {quiz.title}
        </h1>
        <p className="text-body-apple text-ink-muted-80">
          Take turns guessing the ranked list. A correct guess closer to #1
          scores more — guessing #1 is worth {quiz.listLength} points, the last
          spot is worth 1.
        </p>
      </header>

      <section className="mb-xl">
        <h2 className="mb-sm text-tagline font-semibold text-ink">
          Players
        </h2>
        <Stepper
          label="How many players?"
          value={teamCount}
          min={MIN_TEAMS}
          max={MAX_TEAMS}
          onChange={setTeamCount}
          hint={`${MIN_TEAMS}–${MAX_TEAMS} players`}
        />
        <div className="mt-lg flex flex-col gap-sm">
          {Array.from({ length: teamCount }).map((_, i) => (
            <label key={i} className="flex items-center gap-sm">
              <span className="w-[80px] text-caption text-ink-muted-48">
                Player {i + 1}
              </span>
              <input
                type="text"
                value={teamNames[i]}
                maxLength={24}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="mb-sm text-tagline font-semibold text-ink">Rules</h2>
        <Stepper
          label="Rounds"
          value={rounds}
          min={1}
          max={MAX_ROUNDS}
          onChange={setRounds}
          hint="How many times play cycles through"
        />
        <Stepper
          label="Guesses per round, per player"
          value={guessesPerRound}
          min={1}
          max={MAX_GUESSES}
          onChange={setGuessesPerRound}
          hint="Taken one at a time, in rotation"
        />

        <div className="flex items-center justify-between border-b border-divider-soft py-md">
          <div className="flex flex-col">
            <span className="text-body-apple text-ink">Guess timer</span>
            <span className="text-caption text-ink-muted-48">
              Off by default — no time pressure
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={timerEnabled}
            aria-label="Toggle guess timer"
            onClick={() => setTimerEnabled((v) => !v)}
            className={`focus-ring relative h-[30px] w-[52px] rounded-pill transition-colors duration-base ease-soft ${
              timerEnabled ? "bg-primary" : "bg-hairline"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-at-card transition-all duration-base ease-spring ${
                timerEnabled ? "left-[25px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {timerEnabled && (
          <Stepper
            label="Seconds per guess"
            value={timerSeconds}
            min={5}
            max={120}
            onChange={(v) => setTimerSeconds(v)}
            hint="Time limit for each individual guess"
          />
        )}
      </section>

      <div className="flex justify-center">
        <PrimaryButton onClick={handleStart} className="min-w-[200px]">
          Start Game
        </PrimaryButton>
      </div>
    </div>
  );
}
