"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SoloShell } from "./SoloShell";

const PADS = [
  { id: 0, base: "bg-at-coral/70", lit: "bg-at-coral" },
  { id: 1, base: "bg-at-forest/70", lit: "bg-at-forest" },
  { id: 2, base: "bg-at-yellow/70", lit: "bg-at-yellow" },
  { id: 3, base: "bg-at-mint/70", lit: "bg-at-mint" },
];

type Mode = "showing" | "input" | "over";

/**
 * Memory Sequence (Simon-style): watch the pattern light up, then repeat it.
 * Each round adds one more step. One wrong tap ends the game. Score = the
 * highest level (sequence length) you completed.
 */
export function MemorySequence() {
  return (
    <SoloShell
      gameId="memory-sequence"
      title="Memory Sequence"
      category="skill & reflex"
      howToPlay="Watch the pattern light up, then tap it back in the same order. Each round adds one more step. One wrong tap ends the game — how far can you get?"
      startLabel="Start"
      higherIsBetter
      formatScore={(s) => `Level ${s}`}
    >
      {({ finish }) => <MemoryRun finish={finish} />}
    </SoloShell>
  );
}

function MemoryRun({ finish }: { finish: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [mode, setMode] = useState<Mode>("showing");
  const [litPad, setLitPad] = useState<number | null>(null);
  const [inputPos, setInputPos] = useState(0);
  const inputPosRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Play the current sequence, then hand control to the player.
  const playSequence = useCallback((seq: number[]) => {
    setMode("showing");
    setInputPos(0);
    inputPosRef.current = 0;
    clearTimers();
    seq.forEach((pad, i) => {
      timers.current.push(
        setTimeout(() => setLitPad(pad), 600 * i + 300)
      );
      timers.current.push(
        setTimeout(() => setLitPad(null), 600 * i + 700)
      );
    });
    timers.current.push(
      setTimeout(() => setMode("input"), 600 * seq.length + 300)
    );
  }, []);

  // Start: seed the first step.
  useEffect(() => {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    playSequence(first);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tap(padId: number) {
    if (mode !== "input") return;
    const expected = sequence[inputPosRef.current];
    if (padId !== expected) {
      // Wrong — game over. Score is the level you fully completed before this.
      setMode("over");
      clearTimers();
      finish(sequence.length - 1);
      return;
    }
    // Brief lit feedback.
    setLitPad(padId);
    setTimeout(() => setLitPad(null), 180);

    const nextPos = inputPosRef.current + 1;
    inputPosRef.current = nextPos;
    setInputPos(nextPos);

    if (nextPos >= sequence.length) {
      // Completed this level — add a step and replay.
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setTimeout(() => {
        setSequence(nextSeq);
        playSequence(nextSeq);
      }, 500);
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <p className="mb-md text-center text-caption text-ink-muted-48">
        {mode === "showing"
          ? "Watch…"
          : mode === "input"
          ? `Your turn — ${inputPos}/${sequence.length}`
          : ""}
        {"  ·  "}Level {sequence.length}
      </p>
      <div className="grid grid-cols-2 gap-sm">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            type="button"
            aria-label={`Pad ${pad.id + 1}`}
            disabled={mode !== "input"}
            onClick={() => tap(pad.id)}
            className={`h-[130px] rounded-lg shadow-at-card transition-all duration-fast ease-soft ${
              litPad === pad.id ? pad.lit + " scale-[1.03]" : pad.base
            } ${mode === "input" ? "cursor-pointer hover:brightness-105" : "cursor-default"}`}
          />
        ))}
      </div>
    </div>
  );
}
