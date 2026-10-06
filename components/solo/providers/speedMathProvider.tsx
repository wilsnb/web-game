"use client";

import { makeRng } from "@/lib/multiplayer/prng";
import { speedScore, type RoundProvider } from "@/lib/solo/roundTypes";

interface MathRound {
  text: string;
  answer: number;
}

/** One arithmetic problem per round, generated deterministically from seed+index. */
export const speedMathProvider: RoundProvider<MathRound> = {
  gameId: "speed-math-challenge",
  title: "Speed Math Challenge",
  category: "brain teasers",
  howToPlay: "Solve each problem and press Enter. Faster correct answers score more.",

  getRound(index, seed) {
    const rand = makeRng(seed + index * 101);
    const op = ["+", "-", "×"][Math.floor(rand() * 3)];
    if (op === "×") {
      const a = 2 + Math.floor(rand() * 11);
      const b = 2 + Math.floor(rand() * 11);
      return { text: `${a} × ${b}`, answer: a * b };
    }
    let a = 2 + Math.floor(rand() * 48);
    let b = 2 + Math.floor(rand() * 48);
    if (op === "-") {
      if (b > a) [a, b] = [b, a];
      return { text: `${a} − ${b}`, answer: a - b };
    }
    return { text: `${a} + ${b}`, answer: a + b };
  },

  render({ round, onAnswer, locked, elapsedMs }) {
    return <SpeedMathRound round={round} onAnswer={onAnswer} locked={locked} elapsedMs={elapsedMs} />;
  },
};

function SpeedMathRound({
  round,
  onAnswer,
  locked,
  elapsedMs,
}: {
  round: MathRound;
  onAnswer: (r: { correct: boolean; points: number; answerLabel?: string }) => void;
  locked: boolean;
  elapsedMs: () => number;
}) {
  // Local input via an uncontrolled ref keeps re-renders cheap under the timer.
  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
        <p className="text-display-lg font-semibold tabular-nums text-ink">
          {round.text}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (locked) return;
            const input = (e.currentTarget.elements.namedItem("ans") as HTMLInputElement);
            const val = input?.value.trim();
            if (val === "" || val == null) return;
            const guess = Number(val);
            const correct = !Number.isNaN(guess) && guess === round.answer;
            onAnswer({
              correct,
              points: correct ? speedScore(elapsedMs()) : 0,
              answerLabel: val,
            });
          }}
          className="mt-lg"
        >
          <input
            name="ans"
            type="number"
            inputMode="numeric"
            autoFocus
            disabled={locked}
            autoComplete="off"
            aria-label="Your answer"
            className="focus-ring h-[52px] w-full rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-center text-tagline text-ink transition-all duration-base ease-soft focus:border-primary disabled:opacity-60"
            placeholder="?"
          />
        </form>
      </div>
    </div>
  );
}
