"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SoloShell } from "./SoloShell";
import type { SoloGameProps } from "./SoloGame";
import { shuffle } from "@/lib/deckEngine";
import data from "@/data/higherlower/social-media.json";

interface Item {
  name: string;
  value: number;
  label: string;
}

/**
 * Higher or Lower: shown two items, guess which has the bigger value. Correct
 * keeps the streak going and swaps in a new challenger; wrong ends the run.
 * Score = your streak. Real numbers are revealed after each guess.
 */
export function HigherLower({ seed, onFinish, overExtra, multiplayer }: SoloGameProps = {}) {
  return (
    <SoloShell
      gameId="higher-or-lower"
      title="Higher or Lower"
      category="trivia & rankings"
      howToPlay={`${data.prompt} Pick the one you think is higher. Keep your streak alive — one wrong guess ends the run.`}
      startLabel="Start"
      higherIsBetter
      formatScore={(s) => `${s} streak`}
      onFinish={onFinish}
      overExtra={overExtra}
      multiplayer={multiplayer}
    >
      {({ finish }) => <HigherLowerRun finish={finish} seed={seed} />}
    </SoloShell>
  );
}

function HigherLowerRun({
  finish,
  seed,
}: {
  finish: (score: number) => void;
  seed?: number;
}) {
  const items = useMemo(() => {
    const s = typeof seed === "number" ? seed : Math.floor(Math.random() * 1e9);
    return shuffle(data.items as Item[], s);
  }, [seed]);

  // Both items are shown by NAME only during the guess. After the pick, both
  // counts are revealed. left/right are just the two items being compared.
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [streak, setStreak] = useState(0);
  const [reveal, setReveal] = useState<null | {
    correct: boolean;
    picked: "left" | "right";
  }>(null);
  const streakRef = useRef(0);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const left = items[leftIdx];
  const right = items[rightIdx];

  // Advance to the next pair, or finish if we ran out / got it wrong.
  const advance = useCallback(() => {
    if (advanceRef.current) {
      clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
    setReveal((r) => {
      if (!r) return r;
      if (!r.correct) {
        finish(streakRef.current);
        return r;
      }
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);

      // Slide the challenger into the left slot; bring in the next challenger.
      const nextRight = rightIdx + 1;
      if (nextRight >= items.length) {
        finish(nextStreak);
        return r;
      }
      setLeftIdx(rightIdx);
      setRightIdx(nextRight);
      return null;
    });
  }, [finish, rightIdx, items.length]);

  const guess = useCallback(
    (pick: "left" | "right") => {
      if (reveal) return;
      const higher = right.value > left.value ? "right" : "left";
      // Ties (rare with rounded data): treat either pick as correct.
      const correct = right.value === left.value ? true : pick === higher;

      setReveal({ correct, picked: pick });
      // Auto-advance after 3s; a "Next" click can trigger it sooner.
      advanceRef.current = setTimeout(() => advance(), 3000);
    },
    [reveal, right, left, advance]
  );

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-[520px]">
      <p className="mb-md text-center text-caption text-ink-muted-48">
        Streak: {streak} · {data.prompt}
      </p>

      <div className="flex flex-col items-stretch gap-md sm:flex-row">
        <SideCard
          item={left}
          unit={data.unit}
          showValue={!!reveal}
          onPick={() => guess("left")}
          disabled={!!reveal}
          highlight={reveal ? (left.value >= right.value ? "win" : "lose") : null}
        />
        <div className="flex items-center justify-center py-xs">
          <span className="rounded-full bg-pearl px-md py-xs text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-80">
            vs
          </span>
        </div>
        <SideCard
          item={right}
          unit={data.unit}
          showValue={!!reveal}
          onPick={() => guess("right")}
          disabled={!!reveal}
          highlight={reveal ? (right.value >= left.value ? "win" : "lose") : null}
        />
      </div>

      {reveal && (
        <div className="motion-fade mt-md flex flex-col items-center gap-sm">
          <p
            className={`text-body-strong font-semibold ${
              reveal.correct ? "text-at-success" : "text-at-coral"
            }`}
          >
            {reveal.correct ? "Correct!" : "Wrong — streak over"}
          </p>
          <button
            type="button"
            onClick={advance}
            className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
          >
            {reveal.correct ? "Next" : "See result"}
          </button>
        </div>
      )}
    </div>
  );
}

function SideCard({
  item,
  unit,
  showValue,
  onPick,
  disabled,
  highlight,
}: {
  item: Item;
  unit: string;
  showValue: boolean;
  onPick: () => void;
  disabled: boolean;
  highlight: "win" | "lose" | null;
}) {
  const tone =
    highlight === "win"
      ? "border-at-success bg-at-success/10"
      : highlight === "lose"
      ? "border-at-coral bg-at-coral/10"
      : "border-divider-soft bg-canvas hover:border-primary";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={`focus-ring flex flex-1 flex-col items-center justify-center rounded-lg border p-xl text-center shadow-at-card transition-all duration-fast ease-soft ${tone} ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span className="text-body-strong font-semibold text-ink">{item.name}</span>
      {showValue ? (
        <span className="mt-sm flex flex-col">
          <span className="text-display-md font-semibold tabular-nums text-ink">
            {item.label}
          </span>
          <span className="text-caption text-ink-muted-48">{unit}</span>
        </span>
      ) : (
        <span className="mt-sm text-body-apple text-ink-muted-48">
          Tap if higher
        </span>
      )}
    </button>
  );
}
