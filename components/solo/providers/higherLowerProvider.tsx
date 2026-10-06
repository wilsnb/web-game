"use client";

import { shuffle } from "@/lib/deckEngine";
import { speedScore, type RoundProvider } from "@/lib/solo/roundTypes";
import data from "@/data/higherlower/social-media.json";

interface Item {
  name: string;
  value: number;
  label: string;
}

interface HLRound {
  left: Item;
  right: Item;
}

/** One "which is higher?" pair per round, seeded so all players match. */
export const higherLowerProvider: RoundProvider<HLRound> = {
  gameId: "higher-or-lower",
  title: "Higher or Lower",
  category: "trivia & rankings",
  howToPlay: `${data.prompt} Pick the one you think is higher before the timer runs out.`,

  getRound(index, seed) {
    const order = shuffle(data.items as Item[], seed);
    // Each round uses the next adjacent pair in the shuffled list.
    const left = order[index % order.length];
    const right = order[(index + 1) % order.length];
    return { left, right };
  },

  render({ round, onAnswer, locked, elapsedMs }) {
    const pick = (side: "left" | "right") => {
      const higher = round.right.value > round.left.value ? "right" : "left";
      const correct = round.right.value === round.left.value ? true : side === higher;
      onAnswer({
        correct,
        points: correct ? speedScore(elapsedMs()) : 0,
        answerLabel: side === "left" ? round.left.name : round.right.name,
      });
    };
    return (
      <div className="w-full max-w-[520px]">
        <p className="mb-md text-center text-caption text-ink-muted-48">
          {data.prompt}
        </p>
        <div className="flex flex-col items-stretch gap-md sm:flex-row">
          <Side item={round.left} unit={data.unit} reveal={locked} onPick={() => pick("left")} disabled={locked} />
          <div className="flex items-center justify-center py-xs">
            <span className="rounded-full bg-pearl px-md py-xs text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-80">
              vs
            </span>
          </div>
          <Side item={round.right} unit={data.unit} reveal={locked} onPick={() => pick("right")} disabled={locked} />
        </div>
      </div>
    );
  },
};

function Side({
  item,
  unit,
  reveal,
  onPick,
  disabled,
}: {
  item: Item;
  unit: string;
  reveal: boolean;
  onPick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className="focus-ring flex flex-1 flex-col items-center justify-center rounded-lg border border-divider-soft bg-canvas p-xl text-center shadow-at-card transition-all duration-fast ease-soft hover:border-primary disabled:cursor-default"
    >
      <span className="text-body-strong font-semibold text-ink">{item.name}</span>
      {reveal ? (
        <span className="mt-sm flex flex-col">
          <span className="text-display-md font-semibold tabular-nums text-ink">
            {item.label}
          </span>
          <span className="text-caption text-ink-muted-48">{unit}</span>
        </span>
      ) : (
        <span className="mt-sm text-body-apple text-ink-muted-48">Tap if higher</span>
      )}
    </button>
  );
}
