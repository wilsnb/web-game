"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/lib/multiplayer/useRoom";
import { SoloGame } from "@/components/solo/SoloGame";
import type { RoomSoloResult } from "@/lib/multiplayer/room";

/**
 * Solo-race room: everyone plays the SAME seeded solo game on their own device
 * at their own pace, and each player's score lands on a shared live
 * leaderboard. Lobby → play (seeded game + report score) → finished leaderboard.
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
  const submittedRef = useRef(false);

  const [myId, setMyId] = useState<string | null>(viewerId);
  useEffect(() => {
    if (viewerId) setMyId(viewerId);
    else setMyId(sessionStorage.getItem("qwardoo:guestId"));
  }, [viewerId]);

  const host = state?.players.find((p) => p.isHost);
  const isHost = Boolean(myId && host && host.id === myId);
  const inRoom = Boolean(myId && state?.players.some((p) => p.id === myId));

  // --- Join (auto for signed-in link visitors, name prompt for guests) ---
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

  // Report this player's final score to the room (once).
  const submitScore = useCallback(
    async (score: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const guestId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
          : undefined;
      await fetch("/api/rooms/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, score, guestId }),
      }).catch(() => {});
    },
    [code]
  );

  if (!state) {
    return <p className="font-haas text-at-body-md text-at-muted">Loading room…</p>;
  }

  const results = state.soloResults ?? [];

  // --- PLAYING: render the seeded game; leaderboard shows on game-over ---
  if (state.phase === "playing" && inRoom) {
    return (
      <SoloGame
        id={soloGameId}
        seed={state.seed}
        onFinish={submitScore}
        multiplayer
        overExtra={<Leaderboard results={results} myId={myId} live />}
      />
    );
  }

  // --- FINISHED (or playing but not a participant): show the leaderboard ---
  if (state.phase === "finished" || (state.phase === "playing" && !inRoom)) {
    return (
      <div className="flex flex-col gap-lg">
        <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg text-center shadow-at-card">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
            {state.phase === "finished" ? "Final results" : "Live standings"}
          </p>
          <h2 className="motion-pop mt-xs font-haas text-at-display-md font-normal text-at-ink">
            {winnerLabel(results, state.phase === "finished")}
          </h2>
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
          {connected ? "🟢 Live" : "Connecting…"} · Everyone plays the same
          challenge — compare scores at the end.
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

/** Shared leaderboard, sorted by score (highest first), unfinished last. */
function Leaderboard({
  results,
  myId,
  live,
}: {
  results: RoomSoloResult[];
  myId: string | null;
  live: boolean;
}) {
  const sorted = [...results].sort((a, b) => {
    if (a.status !== b.status) return a.status === "finished" ? -1 : 1;
    return (b.score ?? -Infinity) - (a.score ?? -Infinity);
  });

  return (
    <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
      <h3 className="mb-sm font-haas text-at-caption font-medium uppercase tracking-wide text-at-muted">
        {live ? "Live leaderboard" : "Leaderboard"}
      </h3>
      <ol className="flex flex-col">
        {sorted.map((r, i) => (
          <li
            key={r.playerId}
            className="flex items-center justify-between border-b border-at-hairline py-sm font-haas text-at-body-md text-at-ink last:border-b-0"
          >
            <span>
              {i + 1}. {r.name}
              {r.playerId === myId ? " (you)" : ""}
            </span>
            <span className="font-medium">
              {r.status === "finished" ? (
                r.score
              ) : (
                <span className="text-at-caption text-at-muted">playing…</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function winnerLabel(results: RoomSoloResult[], finished: boolean): string {
  const done = results.filter((r) => r.status === "finished" && r.score !== null);
  if (done.length === 0) return finished ? "No scores" : "In progress…";
  const top = Math.max(...done.map((r) => r.score as number));
  const winners = done.filter((r) => r.score === top);
  if (!finished) return "In progress…";
  if (winners.length > 1) return "It's a tie!";
  return `${winners[0].name} wins`;
}
