"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SoloShell } from "./SoloShell";

const ROUNDS = 5;

type Stage = "waiting" | "ready" | "tooSoon" | "clicked";

/**
 * Reaction Time: 5 rounds of "wait for green, then tap." Each round measures
 * the tap latency in ms; the final score is the average (lower is better).
 * Tapping before green = "too soon" and re-arms that round.
 */
export function ReactionTime() {
  return (
    <SoloShell
      gameId="reaction-time-test"
      title="Reaction Time Test"
      category="skill & reflex"
      howToPlay="Wait for the screen to turn green, then tap as fast as you can. Tap too early and the round restarts. Five rounds — your score is the average, lower is faster."
      startLabel="Start"
      higherIsBetter={false}
      formatScore={(s) => `${Math.round(s)} ms`}
    >
      {({ finish }) => <ReactionRun finish={finish} />}
    </SoloShell>
  );
}

function ReactionRun({ finish }: { finish: (score: number) => void }) {
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState<Stage>("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const goAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const armRound = useCallback(() => {
    setStage("waiting");
    setLastMs(null);
    // Random 1.5–4s delay before turning green.
    const delay = 1500 + Math.random() * 2500;
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setStage("ready");
    }, delay);
  }, []);

  useEffect(() => {
    armRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Re-arm whenever the round changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function handleTap() {
    if (stage === "waiting") {
      // Too early — cancel the pending green and restart this round.
      if (timerRef.current) clearTimeout(timerRef.current);
      setStage("tooSoon");
      return;
    }
    if (stage === "tooSoon") {
      armRound();
      return;
    }
    if (stage === "ready") {
      const ms = performance.now() - goAtRef.current;
      setLastMs(ms);
      const nextTimes = [...times, ms];
      setTimes(nextTimes);
      setStage("clicked");
      return;
    }
    if (stage === "clicked") {
      if (round >= ROUNDS) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        finish(avg);
      } else {
        setRound((r) => r + 1);
      }
    }
  }

  const bg =
    stage === "ready"
      ? "bg-at-forest"
      : stage === "tooSoon"
      ? "bg-at-coral"
      : "bg-surface-black";

  return (
    <div className="w-full">
      <p className="mb-sm text-center text-caption text-ink-muted-48">
        Round {round} of {ROUNDS}
      </p>
      <button
        type="button"
        onClick={handleTap}
        className={`focus-ring flex min-h-[320px] w-full flex-col items-center justify-center rounded-lg p-section text-center transition-colors duration-fast ${bg}`}
      >
        {stage === "waiting" && (
          <span className="text-lead font-semibold text-white">
            Wait for green…
          </span>
        )}
        {stage === "ready" && (
          <span className="text-display-lg font-semibold text-white">Tap!</span>
        )}
        {stage === "tooSoon" && (
          <span className="text-lead font-semibold text-white">
            Too soon! Tap to try this round again.
          </span>
        )}
        {stage === "clicked" && (
          <span className="flex flex-col items-center gap-xs text-white">
            <span className="text-display-md font-semibold tabular-nums">
              {lastMs !== null ? `${Math.round(lastMs)} ms` : ""}
            </span>
            <span className="text-body-apple opacity-90">
              {round >= ROUNDS ? "Tap to see your result" : "Tap for next round"}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
