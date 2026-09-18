"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RatingSummary, Vote } from "@/lib/ratings";

const EMPTY = (gameId: string): RatingSummary => ({
  gameId,
  up: 0,
  down: 0,
  total: 0,
  percentPositive: null,
  hasEnough: false,
  myVote: null,
});

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-[18px] w-[18px] ${down ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zM7 10l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17 21H7" />
    </svg>
  );
}

/**
 * Thumbs up/down rating for a game.
 *  - Signed in: tap to vote; tapping your current vote clears it.
 *  - Signed out: buttons nudge to log in.
 *  - Aggregate "% positive · N votes" shows only once total votes >= threshold.
 */
export function RatingButtons({
  gameId,
  initial,
  isSignedIn = false,
  loginNext = "/",
}: {
  gameId: string;
  initial?: RatingSummary;
  isSignedIn?: boolean;
  loginNext?: string;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<RatingSummary>(
    initial ?? EMPTY(gameId)
  );
  const [busy, setBusy] = useState(false);

  // If no initial summary was provided, load it on mount.
  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetch(`/api/rate?game=${encodeURIComponent(gameId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data as RatingSummary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [gameId, initial]);

  async function vote(v: Vote) {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    // Tapping the current vote clears it; otherwise set it.
    const value = summary.myVote === v ? 0 : v;
    const res = await fetch("/api/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, value }),
    });
    if (res.ok) {
      setSummary((await res.json()) as RatingSummary);
    }
    setBusy(false);
  }

  const upActive = summary.myVote === 1;
  const downActive = summary.myVote === -1;

  return (
    <div className="flex flex-col items-center gap-xs">
      <p className="text-caption text-body-muted">Enjoy this game?</p>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          disabled={busy}
          aria-pressed={upActive}
          aria-label="Thumbs up"
          onClick={() => vote(1)}
          className={`press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
            upActive
              ? "border-primary-on-dark bg-primary-on-dark/15 text-primary-on-dark"
              : "border-white/20 text-body-on-dark hover:border-white/50"
          }`}
        >
          <ThumbIcon />
        </button>
        <button
          type="button"
          disabled={busy}
          aria-pressed={downActive}
          aria-label="Thumbs down"
          onClick={() => vote(-1)}
          className={`press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
            downActive
              ? "border-primary-on-dark bg-primary-on-dark/15 text-primary-on-dark"
              : "border-white/20 text-body-on-dark hover:border-white/50"
          }`}
        >
          <ThumbIcon down />
        </button>
      </div>

      {/* Aggregate — only once enough votes have been cast. */}
      {summary.hasEnough ? (
        <p className="text-caption text-body-muted">
          {summary.percentPositive}% positive · {summary.total} votes
        </p>
      ) : (
        <p className="text-caption text-body-muted">
          {isSignedIn
            ? "Be one of the first to rate this game."
            : "Log in to rate this game."}
        </p>
      )}
    </div>
  );
}
