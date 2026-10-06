"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ROUNDS,
  ROUND_SECONDS,
  REVEAL_SECONDS,
  type RoundProvider,
  type RoundResult,
} from "@/lib/solo/roundTypes";
import { saveBestScore, getBestScore } from "@/lib/soloScores";

type Phase = "start" | "playing" | "reveal" | "over";

/**
 * Shared engine for the round-based solo games (10 rounds × 10s, speed-scored).
 * Owns: the per-round timer, scoring, the per-round reveal, round advancement,
 * and the final score. Each game plugs in a RoundProvider for content + render.
 *
 * Online mode: pass `sync`. The engine reports each round result via
 * `sync.onRoundResult` and waits for `sync.gatePhase`/`sync.currentRound` from
 * the room to advance in lockstep, and renders `sync.revealExtra` /
 * `sync.overExtra` (leaderboards) during reveal / game-over.
 */
export interface RoundSync {
  /** Shared seed so every player gets identical rounds. */
  seed: number;
  /** The round index the room says everyone should be on. */
  currentRound: number;
  /** "playing" | "reveal" | "finished" — the room-driven gate. */
  gatePhase: "playing" | "reveal" | "finished";
  /** Report this player's result for the current round to the room. */
  onRoundResult: (index: number, result: RoundResult) => void;
  /** Manually advance the room from the reveal to the next round (skip wait). */
  onAdvance: () => void;
  /** Seconds left before the reveal auto-advances (for the Next button label). */
  revealLeft: number;
  /** Leaderboard/who's-right UI for the reveal screen. */
  revealExtra?: React.ReactNode;
  /** Final leaderboard UI. */
  overExtra?: React.ReactNode;
}

export function RoundGame<R>({
  provider,
  sync,
}: {
  provider: RoundProvider<R>;
  sync?: RoundSync;
}) {
  const online = Boolean(sync);
  const [phase, setPhase] = useState<Phase>(online ? "playing" : "start");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  // Solo uses a one-off random seed; online uses the shared room seed.
  const soloSeedRef = useRef<number>(Math.floor(Math.random() * 1e9));
  const seed = sync ? sync.seed : soloSeedRef.current;

  // In online mode the room drives the active round index + gate phase.
  const activeIndex = online ? sync!.currentRound : index;
  const round = useMemo(
    () => provider.getRound(activeIndex, seed),
    [provider, activeIndex, seed]
  );

  const [locked, setLocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState(ROUND_SECONDS * 1000);
  const roundStartRef = useRef<number>(0);
  const answeredRef = useRef(false);

  // ---- Scoring + answer handling for a round ----
  const handleAnswer = useCallback(
    (result: RoundResult) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setLocked(true);
      setLastResult(result);
      setScore((s) => s + result.points);
      if (online) {
        sync!.onRoundResult(activeIndex, result);
        // Online: stay on the question (locked) until the room moves everyone
        // to the reveal/next round.
      } else {
        // Solo: brief lock to show the answer, then reveal.
        setTimeout(() => setPhase("reveal"), 700);
      }
    },
    [online, sync, activeIndex]
  );

  // ---- Per-round timer (solo + online while playing) ----
  const beginRound = useCallback(() => {
    answeredRef.current = false;
    setLocked(false);
    setLastResult(null);
    roundStartRef.current = performance.now();
    setRemainingMs(ROUND_SECONDS * 1000);
  }, []);

  // Start a fresh round whenever the active index changes while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    beginRound();
  }, [phase, activeIndex, beginRound]);

  useEffect(() => {
    if (phase !== "playing") return;
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - roundStartRef.current;
      const rem = ROUND_SECONDS * 1000 - elapsed;
      setRemainingMs(Math.max(0, rem));
      if (rem <= 0 && !answeredRef.current) {
        // Timeout = a miss.
        handleAnswer({ correct: false, points: 0, answerLabel: "— (timed out)" });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, activeIndex, handleAnswer]);

  // ---- Online: follow the room's gate phase ----
  useEffect(() => {
    if (!online) return;
    if (sync!.gatePhase === "reveal") setPhase("reveal");
    else if (sync!.gatePhase === "finished") setPhase("over");
    else setPhase("playing");
  }, [online, sync?.gatePhase]);

  // ---- Solo: reveal -> next round or finish ----
  const soloContinue = useCallback(() => {
    if (index + 1 >= ROUNDS) {
      const res = saveBestScore(provider.gameId, score, true);
      setBest(res.best);
      setPhase("over");
    } else {
      setIndex((i) => i + 1);
      setPhase("playing");
    }
  }, [index, score, provider.gameId]);

  // Solo reveal: count down REVEAL_SECONDS and auto-advance (manual skip too).
  const [revealLeft, setRevealLeft] = useState(REVEAL_SECONDS);
  useEffect(() => {
    if (online || phase !== "reveal") return;
    setRevealLeft(REVEAL_SECONDS);
    const started = Date.now();
    const id = setInterval(() => {
      const left = REVEAL_SECONDS - Math.floor((Date.now() - started) / 1000);
      if (left <= 0) {
        clearInterval(id);
        soloContinue();
      } else {
        setRevealLeft(left);
      }
    }, 250);
    return () => clearInterval(id);
  }, [online, phase, soloContinue]);

  // ---- Render ----
  if (phase === "start") {
    const stored = getBestScore(provider.gameId);
    return (
      <Shell provider={provider}>
        <div className="motion-pop w-full max-w-[440px] rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
          <p className="text-body-apple leading-relaxed text-ink-muted-80">
            {provider.howToPlay}
          </p>
          <p className="mt-md text-caption text-ink-muted-48">
            {ROUNDS} rounds · {ROUND_SECONDS}s each · faster correct answers score more
          </p>
          {stored !== null && (
            <p className="mt-xxs text-caption text-ink-muted-48">
              Your best: {stored}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setScore(0);
              setPhase("playing");
            }}
            className="press-scale focus-ring mt-lg inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
          >
            Start
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "playing") {
    return (
      <Shell provider={provider}>
        <RoundHud
          index={activeIndex}
          score={score}
          remainingMs={remainingMs}
        />
        {provider.render({
          round,
          onAnswer: handleAnswer,
          locked,
          remainingMs,
          elapsedMs: () => performance.now() - roundStartRef.current,
        })}
      </Shell>
    );
  }

  if (phase === "reveal") {
    return (
      <Shell provider={provider}>
        <div className="w-full max-w-[480px]">
          <div className="motion-pop rounded-lg border border-divider-soft bg-canvas p-lg text-center shadow-at-card">
            <p className="text-caption uppercase tracking-wide text-ink-muted-48">
              Round {activeIndex + 1} of {ROUNDS}
            </p>
            {lastResult && (
              <p
                className={`mt-xs text-tagline font-semibold ${
                  lastResult.correct ? "text-at-success" : "text-at-coral"
                }`}
              >
                {lastResult.correct
                  ? `Correct · +${lastResult.points}`
                  : "Missed · +0"}
              </p>
            )}
          </div>
          {online ? (
            <div className="mt-md flex flex-col gap-md">
              {sync!.revealExtra}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={sync!.onAdvance}
                  className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus active:translate-y-0"
                >
                  {activeIndex + 1 >= ROUNDS
                    ? "See results"
                    : `Next round (${sync!.revealLeft})`}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-lg flex justify-center">
              <button
                type="button"
                onClick={soloContinue}
                className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus active:translate-y-0"
              >
                {index + 1 >= ROUNDS
                  ? "See results"
                  : `Next round (${revealLeft})`}
              </button>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // phase === "over"
  return (
    <Shell provider={provider}>
      <div className="motion-pop w-full max-w-[440px] rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
        <p className="text-caption text-ink-muted-48">
          {online ? "Final results" : "Your score"}
        </p>
        <p className="mt-xxs text-display-lg font-semibold tabular-nums text-ink">
          {score}
        </p>
        {!online && best !== null && (
          <p className="mt-sm text-body-apple text-ink-muted-80">Best: {best}</p>
        )}
        {online ? (
          <div className="mt-lg">{sync!.overExtra}</div>
        ) : (
          <div className="mt-lg flex flex-col items-center gap-sm sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                soloSeedRef.current = Math.floor(Math.random() * 1e9);
                setIndex(0);
                setScore(0);
                setPhase("playing");
              }}
              className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus active:translate-y-0"
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
    </Shell>
  );
}

/** Page shell: header (title + exit) + centered content area. */
function Shell<R>({
  provider,
  children,
}: {
  provider: RoundProvider<R>;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-content flex-col px-lg py-xl">
      <div className="mb-lg flex items-center justify-between">
        <div>
          <p className="text-caption capitalize text-ink-muted-48">
            {provider.category}
          </p>
          <h1 className="text-display-md font-semibold tracking-tight text-ink">
            {provider.title}
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
        {children}
      </div>
    </div>
  );
}

/** Round number + score + the per-round countdown bar. */
function RoundHud({
  index,
  score,
  remainingMs,
}: {
  index: number;
  score: number;
  remainingMs: number;
}) {
  const frac = Math.max(0, Math.min(1, remainingMs / (ROUND_SECONDS * 1000)));
  const low = remainingMs <= 3000;
  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-xs flex items-center justify-between text-caption text-ink-muted-48">
        <span>
          Round {index + 1} of {ROUNDS}
        </span>
        <span>{score} pts</span>
      </div>
      <div className="h-[6px] w-full overflow-hidden rounded-pill bg-divider-soft">
        <div
          className={`h-full rounded-pill transition-[width] duration-100 ease-linear ${
            low ? "bg-at-coral" : "bg-primary"
          }`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}
