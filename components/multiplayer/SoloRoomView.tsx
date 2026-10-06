"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/lib/multiplayer/useRoom";
import { SoloGame } from "@/components/solo/SoloGame";
import type { RoundSync } from "@/components/solo/RoundGame";
import type { RoundResult } from "@/lib/solo/roundTypes";
import { REVEAL_SECONDS } from "@/lib/solo/roundTypes";
import type { RoomSoloResult } from "@/lib/multiplayer/room";

/**
 * Round-synchronized solo-race room. Everyone plays the SAME seeded game, one
 * round at a time: answer within the round, wait for the group, see who got it
 * right on the reveal, then advance together. Live leaderboard throughout.
 */
export function SoloRoomView({
  code,
  soloGameId,
  viewerId,
}: {
  code: string;
  soloGameId: string;
  viewerId: string | null;
}) {
  const { state, connected } = useRoom(code);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [myId, setMyId] = useState<string | null>(viewerId);
  useEffect(() => {
    if (viewerId) setMyId(viewerId);
    else setMyId(sessionStorage.getItem("qwardoo:guestId"));
  }, [viewerId]);

  const host = state?.players.find((p) => p.isHost);
  const isHost = Boolean(myId && host && host.id === myId);
  const inRoom = Boolean(myId && state?.players.some((p) => p.id === myId));

  // --- Join (auto for signed-in link visitors; name prompt for guests) ---
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  const join = useCallback(
    async (guestName?: string) => {
      setJoining(true);
      setError(null);
      let guestId = "";
      if (!viewerId) {
        guestId = sessionStorage.getItem("qwardoo:guestId") || "";
        if (!guestId) {
          guestId = "guest_" + Math.random().toString(36).slice(2, 10);
          sessionStorage.setItem("qwardoo:guestId", guestId);
        }
        if (guestName) sessionStorage.setItem("qwardoo:guestName", guestName);
        setMyId(guestId);
      }
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, guestName: guestName ?? "", guestId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Could not join this room.");
      }
      setJoining(false);
    },
    [code, viewerId]
  );

  useEffect(() => {
    if (!state || state.phase !== "lobby") return;
    if (inRoom || autoJoined || !viewerId) return;
    setAutoJoined(true);
    join();
  }, [state, inRoom, autoJoined, viewerId, join]);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Could not start.");
    }
    setBusy(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/multiplayer/${code}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is still visible */
    }
  }

  const guestId = () =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
      : undefined;

  // Report a round result to the room.
  const onRoundResult = useCallback(
    (index: number, result: RoundResult) => {
      fetch("/api/rooms/submit-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          action: "answer",
          round: index,
          correct: result.correct,
          points: result.points,
          guestId: guestId(),
        }),
      }).catch(() => {});
    },
    [code]
  );

  // Manually advance the room from reveal -> next round (server is idempotent).
  const advance = useCallback(() => {
    fetch("/api/rooms/submit-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action: "advance", guestId: guestId() }),
    }).catch(() => {});
  }, [code]);

  // During reveal: count down REVEAL_SECONDS and auto-advance at 0. Any client
  // may trigger (server idempotent). Resets per round.
  const [revealLeft, setRevealLeft] = useState(REVEAL_SECONDS);
  const advancedForRef = useRef<number | null>(null);
  useEffect(() => {
    if (!state || state.mode !== "solo-race") return;
    if (state.phase !== "playing" || state.roundPhase !== "reveal") return;
    const round = state.currentRound ?? 0;
    setRevealLeft(REVEAL_SECONDS);
    const started = Date.now();
    const id = setInterval(() => {
      const left = REVEAL_SECONDS - Math.floor((Date.now() - started) / 1000);
      setRevealLeft(Math.max(0, left));
      if (left <= 0 && advancedForRef.current !== round) {
        advancedForRef.current = round;
        clearInterval(id);
        advance();
      }
    }, 250);
    return () => clearInterval(id);
  }, [state, advance]);

  if (!state) {
    return <p className="font-haas text-at-body-md text-at-muted">Loading room…</p>;
  }

  const results = state.soloResults ?? [];

  // --- PLAYING / FINISHED: drive the RoundGame engine via sync ---
  if ((state.phase === "playing" || state.phase === "finished") && inRoom) {
    const sync: RoundSync = {
      seed: state.seed ?? 1,
      currentRound: state.currentRound ?? 0,
      gatePhase:
        state.phase === "finished"
          ? "finished"
          : state.roundPhase === "reveal"
          ? "reveal"
          : "playing",
      onRoundResult,
      onAdvance: advance,
      revealLeft,
      revealExtra: <Leaderboard results={results} myId={myId} live />,
      overExtra: <Leaderboard results={results} myId={myId} live={false} />,
    };
    return <SoloGame id={soloGameId} sync={sync} />;
  }

  // Non-participant watching a game in progress: just the leaderboard.
  if (state.phase === "playing" || state.phase === "finished") {
    return (
      <div className="flex flex-col gap-lg">
        <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg text-center shadow-at-card">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
            {state.phase === "finished" ? "Final results" : "Live standings"}
          </p>
        </div>
        <Leaderboard results={results} myId={myId} live={state.phase !== "finished"} />
      </div>
    );
  }

  // --- LOBBY ---
  return (
    <div className="flex flex-col gap-lg">
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
          Room code
        </p>
        <p className="font-haas text-at-display-md tracking-widest text-at-ink">
          {code}
        </p>
        <p className="mt-xs font-haas text-at-caption text-at-muted">
          {connected ? "🟢 Live" : "Connecting…"} · 10 rounds · everyone gets the
          same questions, fastest correct answers score more.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-sm inline-flex h-[36px] items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-md font-haas text-at-caption font-medium text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          {copied ? "Link copied ✓" : "Copy invite link"}
        </button>
      </div>

      {!inRoom && !viewerId && (
        <div className="motion-rise rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <p className="font-haas text-at-body-md text-at-ink">Join this room to play</p>
          <div className="mt-sm flex flex-col gap-sm sm:flex-row">
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={24}
              placeholder="Your name"
              className="h-[44px] flex-1 rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
            />
            <button
              type="button"
              disabled={joining || !joinName.trim()}
              onClick={() => join(joinName.trim())}
              className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <h2 className="font-haas text-at-title-md font-normal text-at-ink">
          Players ({state.players.length})
        </h2>
        <ul className="mt-sm flex flex-col gap-xs">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between border-b border-at-hairline py-xs font-haas text-at-body-md text-at-ink last:border-b-0"
            >
              <span>
                {p.name}
                {p.id === myId && (
                  <span className="ml-xs text-at-caption text-at-muted">(you)</span>
                )}
              </span>
              <span className="text-at-caption text-at-muted">
                {p.isHost ? "Host" : p.isGuest ? "Guest" : "Player"}
              </span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            type="button"
            disabled={busy}
            onClick={start}
            className="mt-md inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
          >
            {busy ? "Starting…" : "Start game"}
          </button>
        ) : (
          <p className="mt-md font-haas text-at-body-md text-at-muted">
            Waiting for the host to start…
          </p>
        )}
      </div>

      {error && (
        <p className="motion-fade font-haas text-at-body-md text-at-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared leaderboard, sorted by cumulative total (highest first). */
function Leaderboard({
  results,
  myId,
  live,
}: {
  results: RoomSoloResult[];
  myId: string | null;
  live: boolean;
}) {
  const sorted = [...results].sort((a, b) => b.total - a.total);
  return (
    <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
      <h3 className="mb-sm font-haas text-at-caption font-medium uppercase tracking-wide text-at-muted">
        {live ? "Live leaderboard" : "Final leaderboard"}
      </h3>
      <ol className="flex flex-col">
        {sorted.map((r, i) => {
          const last = r.rounds[r.rounds.length - 1];
          return (
            <li
              key={r.playerId}
              className="flex items-center justify-between border-b border-at-hairline py-sm font-haas text-at-body-md text-at-ink last:border-b-0"
            >
              <span>
                {i + 1}. {r.name}
                {r.playerId === myId ? " (you)" : ""}
                {live && last && (
                  <span
                    className={`ml-xs text-at-caption ${
                      last.correct ? "text-at-success" : "text-at-coral"
                    }`}
                  >
                    {last.correct ? `+${last.points}` : "miss"}
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums">{r.total}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
