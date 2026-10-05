"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { getBestScore, saveBestScore } from "@/lib/soloScores";

type Phase = "start" | "playing" | "over";

/**
 * Shared scaffold for the solo skill/brain games:
 *   start screen -> play -> game-over (score + best + play again).
 *
 * Each game renders its own play UI via the `children` render-prop, and calls
 * `onFinish(score)` when a run ends. The shell owns phase + best-score
 * persistence so every solo game behaves consistently.
 */
export function SoloShell({
  gameId,
  title,
  category,
  howToPlay,
  startLabel = "Start",
  higherIsBetter,
  /** Formats a score for display (e.g. "312 ms", "17 correct", "Level 8"). */
  formatScore,
  onFinish,
  overExtra,
  multiplayer,
  children,
}: {
  gameId: string;
  title: string;
  category: string;
  howToPlay: string;
  startLabel?: string;
  higherIsBetter: boolean;
  formatScore: (score: number) => string;
  /**
   * Solo-race only: fired with the final score when a run ends, so the caller
   * can post it to the room. When set, the game-over screen shows the shared
   * leaderboard area (via `overExtra`) instead of the local play-again card.
   */
  onFinish?: (score: number) => void;
  /** Solo-race only: extra UI rendered on the game-over screen (leaderboard). */
  overExtra?: React.ReactNode;
  /** Hide the single-player "play again"/best UI (used in multiplayer). */
  multiplayer?: boolean;
  children: (api: {
    finish: (score: number) => void;
  }) => React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("start");
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const start = useCallback(() => {
    setBest(getBestScore(gameId));
    setPhase("playing");
  }, [gameId]);

  const finish = useCallback(
    (score: number) => {
      const res = saveBestScore(gameId, score, higherIsBetter);
      setLastScore(score);
      setBest(res.best);
      setIsNewBest(res.isNewBest);
      setPhase("over");
      onFinish?.(score);
    },
    [gameId, higherIsBetter, onFinish]
  );

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-content flex-col px-lg py-xl">
      {/* Header */}
      <div className="mb-lg flex items-center justify-between">
        <div>
          <p className="text-caption capitalize text-ink-muted-48">{category}</p>
          <h1 className="text-display-md font-semibold tracking-tight text-ink">
            {title}
          </h1>
        </div>
        <Link
          href="/"
          className="text-caption text-primary transition-colors duration-fast ease-soft hover:text-primary-focus"
        >
          Exit
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-lg">
        {phase === "start" && (
          <div className="motion-pop w-full max-w-[440px] rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
            <p className="text-body-apple leading-relaxed text-ink-muted-80">
              {howToPlay}
            </p>
            {getBestScoreLabel(gameId, formatScore)}
            <button
              type="button"
              onClick={start}
              className="press-scale focus-ring mt-lg inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
            >
              {startLabel}
            </button>
          </div>
        )}

        {phase === "playing" && children({ finish })}

        {phase === "over" && (
          <div className="motion-pop w-full max-w-[440px] rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
            {isNewBest && (
              <p className="mb-xs text-caption-strong font-semibold uppercase tracking-wide text-primary">
                New best!
              </p>
            )}
            <p className="text-caption text-ink-muted-48">Your score</p>
            <p className="mt-xxs text-display-lg font-semibold tabular-nums text-ink">
              {lastScore !== null ? formatScore(lastScore) : "—"}
            </p>
            {!multiplayer && best !== null && (
              <p className="mt-sm text-body-apple text-ink-muted-80">
                Best: {formatScore(best)}
              </p>
            )}

            {/* Multiplayer: show the shared leaderboard; no local play-again. */}
            {multiplayer ? (
              <div className="mt-lg">{overExtra}</div>
            ) : (
              <div className="mt-lg flex flex-col items-center gap-sm sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={start}
                  className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
                >
                  Play again
                </button>
                <Link
                  href="/"
                  className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill border border-primary px-lg text-body-apple text-primary no-underline transition-all duration-base ease-soft hover:-translate-y-[1px] active:translate-y-0"
                >
                  Back to games
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small helper: show the stored best on the start screen if one exists. */
function getBestScoreLabel(
  gameId: string,
  formatScore: (score: number) => string
) {
  const best = getBestScore(gameId);
  if (best === null) return null;
  return (
    <p className="mt-md text-caption text-ink-muted-48">
      Your best: {formatScore(best)}
    </p>
  );
}
