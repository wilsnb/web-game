"use client";

import { useEffect, useRef, useState } from "react";
import { makeRng } from "@/lib/multiplayer/prng";
import { speedScore, type RoundProvider, type RoundResult } from "@/lib/solo/roundTypes";

const PADS = [
  { id: 0, base: "bg-at-coral/70", lit: "bg-at-coral" },
  { id: 1, base: "bg-at-forest/70", lit: "bg-at-forest" },
  { id: 2, base: "bg-at-yellow/70", lit: "bg-at-yellow" },
  { id: 3, base: "bg-at-mint/70", lit: "bg-at-mint" },
];

interface MemoryRound {
  sequence: number[];
}

/** Memory: watch the seeded pattern (grows each round), then tap it back. */
export const memoryProvider: RoundProvider<MemoryRound> = {
  gameId: "memory-sequence",
  title: "Memory Sequence",
  category: "skill & reflex",
  howToPlay: "Watch the pattern, then tap it back in order. It gets one longer each round.",

  getRound(index, seed) {
    const rand = makeRng(seed + 777);
    // Deterministic growing sequence: round index -> length index+2.
    const len = index + 2;
    const full: number[] = [];
    for (let i = 0; i < len; i++) full.push(Math.floor(rand() * 4));
    return { sequence: full };
  },

  render({ round, onAnswer, locked, elapsedMs }) {
    return (
      <MemoryRoundView
        round={round}
        onAnswer={onAnswer}
        locked={locked}
        elapsedMs={elapsedMs}
      />
    );
  },
};

function MemoryRoundView({
  round,
  onAnswer,
  locked,
  elapsedMs,
}: {
  round: MemoryRound;
  onAnswer: (r: RoundResult) => void;
  locked: boolean;
  elapsedMs: () => number;
}) {
  const [phase, setPhase] = useState<"showing" | "input">("showing");
  const [litPad, setLitPad] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Play the pattern, then open input. Note: the engine's 10s round timer runs
  // concurrently; the showing phase is kept brief so there's time to answer.
  useEffect(() => {
    setPhase("showing");
    setPos(0);
    posRef.current = 0;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    round.sequence.forEach((pad, i) => {
      timers.current.push(setTimeout(() => setLitPad(pad), 450 * i + 200));
      timers.current.push(setTimeout(() => setLitPad(null), 450 * i + 500));
    });
    timers.current.push(
      setTimeout(() => setPhase("input"), 450 * round.sequence.length + 200)
    );
    return () => timers.current.forEach(clearTimeout);
  }, [round]);

  function tap(padId: number) {
    if (locked || phase !== "input") return;
    const expected = round.sequence[posRef.current];
    if (padId !== expected) {
      onAnswer({ correct: false, points: 0, answerLabel: "wrong order" });
      return;
    }
    setLitPad(padId);
    setTimeout(() => setLitPad(null), 150);
    const next = posRef.current + 1;
    posRef.current = next;
    setPos(next);
    if (next >= round.sequence.length) {
      onAnswer({ correct: true, points: speedScore(elapsedMs()), answerLabel: "correct" });
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <p className="mb-md text-center text-caption text-ink-muted-48">
        {phase === "showing"
          ? "Watch…"
          : `Your turn — ${pos}/${round.sequence.length}`}
      </p>
      <div className="grid grid-cols-2 gap-sm">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            type="button"
            aria-label={`Pad ${pad.id + 1}`}
            disabled={phase !== "input" || locked}
            onClick={() => tap(pad.id)}
            className={`h-[130px] rounded-lg shadow-at-card transition-all duration-fast ease-soft ${
              litPad === pad.id ? pad.lit + " scale-[1.03]" : pad.base
            } ${phase === "input" && !locked ? "cursor-pointer hover:brightness-105" : "cursor-default"}`}
          />
        ))}
      </div>
    </div>
  );
}
