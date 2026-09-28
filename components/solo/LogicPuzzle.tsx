"use client";

import { useMemo, useState } from "react";
import { SoloShell } from "./SoloShell";
import { shuffle } from "@/lib/deckEngine";
import puzzleData from "@/data/puzzles/logic-puzzles.json";

const ROUNDS = 10;

interface Puzzle {
  prompt: string;
  options: string[];
  answer: string;
}

/**
 * Logic & Pattern Puzzle: a run of {ROUNDS} pattern questions drawn from the
 * puzzle bank. Pick the right option; score = number correct. Content-driven,
 * so the bank can grow without touching this component.
 */
export function LogicPuzzle() {
  return (
    <SoloShell
      gameId="logic-pattern-puzzle"
      title="Logic & Pattern Puzzle"
      category="brain teasers"
      howToPlay={`Spot the pattern and pick the answer. ${ROUNDS} puzzles per run — one point each. No timer, just brain power.`}
      startLabel="Start"
      higherIsBetter
      formatScore={(s) => `${s} / ${ROUNDS}`}
    >
      {({ finish }) => <LogicRun finish={finish} />}
    </SoloShell>
  );
}

function LogicRun({ finish }: { finish: (score: number) => void }) {
  const puzzles = useMemo(() => {
    const all = puzzleData.puzzles as Puzzle[];
    const seed = Math.floor(Math.random() * 1e9);
    return shuffle(all, seed).slice(0, Math.min(ROUNDS, all.length));
  }, []);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const puzzle = puzzles[index];

  // Options shuffled once per puzzle so the answer position varies.
  const options = useMemo(() => {
    const seed = (index + 1) * 7919;
    return shuffle(puzzle.options, seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function choose(option: string) {
    if (picked !== null) return;
    setPicked(option);
    const isCorrect = option === puzzle.answer;
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(nextScore);

    setTimeout(() => {
      if (index + 1 >= puzzles.length) {
        finish(nextScore);
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 650);
  }

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-md flex items-center justify-between text-caption text-ink-muted-48">
        <span>
          Puzzle {index + 1} of {puzzles.length}
        </span>
        <span>{score} correct</span>
      </div>

      <div className="rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
        <p className="text-lead font-semibold text-ink">{puzzle.prompt}</p>
      </div>

      <div className="mt-lg grid grid-cols-2 gap-sm">
        {options.map((option) => {
          const isAnswer = option === puzzle.answer;
          const isPicked = option === picked;
          let tone =
            "border-divider-soft bg-canvas text-ink hover:border-primary";
          if (picked !== null) {
            if (isAnswer) tone = "border-at-success bg-at-success/10 text-ink";
            else if (isPicked) tone = "border-at-coral bg-at-coral/10 text-ink";
            else tone = "border-divider-soft bg-canvas text-ink-muted-48";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(option)}
              className={`focus-ring min-h-[64px] rounded-lg border p-md text-body-strong font-semibold transition-all duration-fast ease-soft ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
