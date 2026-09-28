"use client";

import { useMemo, useState } from "react";
import { SoloShell } from "./SoloShell";
import { shuffle } from "@/lib/deckEngine";
import puzzleData from "@/data/puzzles/odd-one-out.json";

const ROUNDS = 10;

interface Puzzle {
  items: string[];
  answer: string;
  reason: string;
}

/**
 * Odd One Out: a run of {ROUNDS} puzzles — pick the item that doesn't belong.
 * A short reason is revealed after each pick. Score = number correct.
 */
export function OddOneOut() {
  return (
    <SoloShell
      gameId="odd-one-out"
      title="Odd One Out"
      category="brain teasers"
      howToPlay={`Four things — one doesn't belong with the others. Tap it. ${ROUNDS} puzzles per run, one point each.`}
      startLabel="Start"
      higherIsBetter
      formatScore={(s) => `${s} / ${ROUNDS}`}
    >
      {({ finish }) => <OddOneOutRun finish={finish} />}
    </SoloShell>
  );
}

function OddOneOutRun({ finish }: { finish: (score: number) => void }) {
  const puzzles = useMemo(() => {
    const all = puzzleData.puzzles as Puzzle[];
    const seed = Math.floor(Math.random() * 1e9);
    return shuffle(all, seed).slice(0, Math.min(ROUNDS, all.length));
  }, []);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const puzzle = puzzles[index];

  const items = useMemo(() => {
    const seed = (index + 1) * 6733;
    return shuffle(puzzle.items, seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function choose(item: string) {
    if (picked !== null) return;
    setPicked(item);
    const isCorrect = item === puzzle.answer;
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(nextScore);

    setTimeout(() => {
      if (index + 1 >= puzzles.length) {
        finish(nextScore);
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 1100);
  }

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-md flex items-center justify-between text-caption text-ink-muted-48">
        <span>
          Puzzle {index + 1} of {puzzles.length}
        </span>
        <span>{score} correct</span>
      </div>

      <p className="mb-md text-center text-body-apple text-ink-muted-80">
        Which one doesn&apos;t belong?
      </p>

      <div className="grid grid-cols-2 gap-sm">
        {items.map((item) => {
          const isAnswer = item === puzzle.answer;
          const isPicked = item === picked;
          let tone =
            "border-divider-soft bg-canvas text-ink hover:border-primary";
          if (picked !== null) {
            if (isAnswer) tone = "border-at-success bg-at-success/10 text-ink";
            else if (isPicked) tone = "border-at-coral bg-at-coral/10 text-ink";
            else tone = "border-divider-soft bg-canvas text-ink-muted-48";
          }
          return (
            <button
              key={item}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(item)}
              className={`focus-ring min-h-[72px] rounded-lg border p-md text-body-strong font-semibold transition-all duration-fast ease-soft ${tone}`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <p className="motion-fade mt-md text-center text-caption text-ink-muted-80">
          {puzzle.reason}
        </p>
      )}
    </div>
  );
}
