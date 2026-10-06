"use client";

import { shuffle } from "@/lib/deckEngine";
import { speedScore, type RoundProvider } from "@/lib/solo/roundTypes";
import puzzleData from "@/data/puzzles/odd-one-out.json";

interface Puzzle {
  items: string[];
  answer: string;
  reason: string;
}

interface OddRound {
  items: string[];
  answer: string;
  reason: string;
}

/** Odd One Out as a round provider. */
export const oddOneOutProvider: RoundProvider<OddRound> = {
  gameId: "odd-one-out",
  title: "Odd One Out",
  category: "brain teasers",
  howToPlay: "Four things — one doesn't belong. Tap it before the timer runs out.",

  getRound(index, seed) {
    const all = puzzleData.puzzles as Puzzle[];
    const order = shuffle(all, seed);
    const p = order[index % order.length];
    const items = shuffle(p.items, seed + index * 6733);
    return { items, answer: p.answer, reason: p.reason };
  },

  render({ round, onAnswer, locked, elapsedMs }) {
    return (
      <div className="w-full max-w-[480px]">
        <p className="mb-md text-center text-body-apple text-ink-muted-80">
          Which one doesn&apos;t belong?
        </p>
        <div className="grid grid-cols-2 gap-sm">
          {round.items.map((item) => (
            <button
              key={item}
              type="button"
              disabled={locked}
              onClick={() => {
                const correct = item === round.answer;
                onAnswer({
                  correct,
                  points: correct ? speedScore(elapsedMs()) : 0,
                  answerLabel: item,
                });
              }}
              className="focus-ring min-h-[72px] rounded-lg border border-divider-soft bg-canvas p-md text-body-strong font-semibold text-ink transition-all duration-fast ease-soft hover:border-primary disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  },
};
