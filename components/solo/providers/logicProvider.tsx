"use client";

import { shuffle } from "@/lib/deckEngine";
import { speedScore, type RoundProvider } from "@/lib/solo/roundTypes";
import puzzleData from "@/data/puzzles/logic-puzzles.json";

interface Puzzle {
  prompt: string;
  options: string[];
  answer: string;
}

interface LogicRound {
  prompt: string;
  options: string[];
  answer: string;
}

/** Logic & Pattern Puzzle as a round provider. */
export const logicProvider: RoundProvider<LogicRound> = {
  gameId: "logic-pattern-puzzle",
  title: "Logic & Pattern Puzzle",
  category: "brain teasers",
  howToPlay: "Spot the pattern and pick the answer before the timer runs out.",

  getRound(index, seed) {
    const all = puzzleData.puzzles as Puzzle[];
    const order = shuffle(all, seed);
    const p = order[index % order.length];
    const options = shuffle(p.options, seed + index * 7919);
    return { prompt: p.prompt, options, answer: p.answer };
  },

  render({ round, onAnswer, locked, elapsedMs }) {
    return (
      <div className="w-full max-w-[480px]">
        <div className="rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
          <p className="text-lead font-semibold text-ink">{round.prompt}</p>
        </div>
        <div className="mt-lg grid grid-cols-2 gap-sm">
          {round.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => {
                const correct = option === round.answer;
                onAnswer({
                  correct,
                  points: correct ? speedScore(elapsedMs()) : 0,
                  answerLabel: option,
                });
              }}
              className="focus-ring min-h-[64px] rounded-lg border border-divider-soft bg-canvas p-md text-body-strong font-semibold text-ink transition-all duration-fast ease-soft hover:border-primary disabled:opacity-60"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  },
};
