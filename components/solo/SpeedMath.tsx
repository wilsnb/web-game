"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SoloShell } from "./SoloShell";
import type { SoloGameProps } from "./SoloGame";
import { randSource } from "@/lib/multiplayer/prng";

const DURATION = 60; // seconds

interface Problem {
  text: string;
  answer: number;
}

/** Generate an arithmetic problem (+, −, ×) with tidy operands from `rand`. */
function makeProblem(rand: () => number): Problem {
  const op = ["+", "-", "×"][Math.floor(rand() * 3)];
  let a: number;
  let b: number;
  if (op === "×") {
    a = 2 + Math.floor(rand() * 11); // 2–12
    b = 2 + Math.floor(rand() * 11);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  a = 2 + Math.floor(rand() * 48); // 2–49
  b = 2 + Math.floor(rand() * 48);
  if (op === "-") {
    // Keep it non-negative for a cleaner feel.
    if (b > a) [a, b] = [b, a];
    return { text: `${a} − ${b}`, answer: a - b };
  }
  return { text: `${a} + ${b}`, answer: a + b };
}

/**
 * Speed Math: 60-second sprint. Solve as many auto-generated problems as you
 * can; a correct answer advances instantly. Score = number correct.
 *
 * In solo-race the problem sequence is seeded, so every player gets the exact
 * same problems in the same order — a fair head-to-head.
 */
export function SpeedMath({ seed, onFinish, overExtra, multiplayer }: SoloGameProps = {}) {
  return (
    <SoloShell
      gameId="speed-math-challenge"
      title="Speed Math Challenge"
      category="brain teasers"
      howToPlay="You have 60 seconds. Type the answer to each problem and press Enter — a correct answer jumps to the next one instantly. How many can you solve?"
      startLabel="Start"
      higherIsBetter
      formatScore={(s) => `${s} correct`}
      onFinish={onFinish}
      overExtra={overExtra}
      multiplayer={multiplayer}
    >
      {({ finish }) => <SpeedMathRun finish={finish} seed={seed} />}
    </SoloShell>
  );
}

function SpeedMathRun({
  finish,
  seed,
}: {
  finish: (score: number) => void;
  seed?: number;
}) {
  // One seeded (or random) source powers the whole problem stream.
  const rand = useMemo(() => randSource(seed), [seed]);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(rand));
  const [value, setValue] = useState("");
  const [correct, setCorrect] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [flash, setFlash] = useState<"none" | "wrong">("none");
  const inputRef = useRef<HTMLInputElement>(null);
  const correctRef = useRef(0);

  // Countdown; finish at 0.
  useEffect(() => {
    if (secondsLeft <= 0) {
      finish(correctRef.current);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, finish]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [problem]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const guess = Number(value.trim());
    if (value.trim() === "" || Number.isNaN(guess)) return;
    if (guess === problem.answer) {
      const next = correct + 1;
      setCorrect(next);
      correctRef.current = next;
      setProblem(makeProblem(rand));
      setValue("");
    } else {
      // Wrong — flash red, clear, let them retry the same problem.
      setFlash("wrong");
      setValue("");
      setTimeout(() => setFlash("none"), 250);
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-lg flex items-center justify-between">
        <span className="text-caption text-ink-muted-48">
          {correct} correct
        </span>
        <span
          className={`text-tagline font-semibold tabular-nums ${
            secondsLeft <= 10 ? "text-primary" : "text-ink-muted-80"
          }`}
        >
          {secondsLeft}s
        </span>
      </div>

      <div
        className={`rounded-lg border p-section text-center shadow-at-card transition-colors duration-fast ${
          flash === "wrong"
            ? "border-at-coral bg-at-coral/5"
            : "border-divider-soft bg-canvas"
        }`}
      >
        <p className="text-display-lg font-semibold tabular-nums text-ink">
          {problem.text}
        </p>
        <form onSubmit={submit} className="mt-lg">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            aria-label="Your answer"
            className="focus-ring h-[52px] w-full rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-center text-tagline text-ink transition-all duration-base ease-soft focus:border-primary"
            placeholder="?"
          />
        </form>
      </div>
    </div>
  );
}
