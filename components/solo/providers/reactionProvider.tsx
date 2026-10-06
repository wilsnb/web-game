"use client";

import { useEffect, useRef, useState } from "react";
import { makeRng } from "@/lib/multiplayer/prng";
import {
  ROUND_MAX_POINTS,
  ROUND_MIN_POINTS,
  type RoundProvider,
  type RoundResult,
} from "@/lib/solo/roundTypes";

interface ReactionRound {
  /** ms to wait before the pad turns green (seeded, identical for all). */
  greenDelay: number;
}

/** Reaction Time: tap when it turns green. Faster tap = more points. */
export const reactionProvider: RoundProvider<ReactionRound> = {
  gameId: "reaction-time-test",
  title: "Reaction Time Test",
  category: "skill & reflex",
  howToPlay: "Wait for green, then tap as fast as you can. The faster you tap, the more points.",

  getRound(index, seed) {
    const rand = makeRng(seed + index * 211);
    return { greenDelay: 1200 + rand() * 2300 }; // 1.2–3.5s
  },

  render({ round, onAnswer, locked }) {
    return <ReactionRoundView round={round} onAnswer={onAnswer} locked={locked} />;
  },
};

function ReactionRoundView({
  round,
  onAnswer,
  locked,
}: {
  round: ReactionRound;
  onAnswer: (r: RoundResult) => void;
  locked: boolean;
}) {
  const [stage, setStage] = useState<"waiting" | "ready" | "tooSoon">("waiting");
  const greenAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStage("waiting");
    timerRef.current = setTimeout(() => {
      greenAtRef.current = performance.now();
      setStage("ready");
    }, round.greenDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [round]);

  function tap() {
    if (locked) return;
    if (stage === "waiting") {
      // Too early — this round is a miss.
      if (timerRef.current) clearTimeout(timerRef.current);
      setStage("tooSoon");
      onAnswer({ correct: false, points: 0, answerLabel: "too soon" });
      return;
    }
    if (stage === "ready") {
      const ms = performance.now() - greenAtRef.current;
      // Faster = more points. ~150ms → max, ~650ms+ → min.
      const frac = Math.min(1, Math.max(0, (ms - 150) / 500));
      const points = Math.round(
        ROUND_MAX_POINTS - frac * (ROUND_MAX_POINTS - ROUND_MIN_POINTS)
      );
      onAnswer({ correct: true, points, answerLabel: `${Math.round(ms)} ms` });
    }
  }

  const bg =
    stage === "ready"
      ? "bg-at-forest"
      : stage === "tooSoon"
      ? "bg-at-coral"
      : "bg-surface-black";

  return (
    <button
      type="button"
      onClick={tap}
      disabled={locked && stage !== "ready"}
      className={`focus-ring flex min-h-[320px] w-full max-w-[480px] flex-col items-center justify-center rounded-lg p-section text-center transition-colors duration-fast ${bg}`}
    >
      {stage === "waiting" && (
        <span className="text-lead font-semibold text-white">Wait for green…</span>
      )}
      {stage === "ready" && (
        <span className="text-display-lg font-semibold text-white">Tap!</span>
      )}
      {stage === "tooSoon" && (
        <span className="text-lead font-semibold text-white">Too soon!</span>
      )}
    </button>
  );
}
