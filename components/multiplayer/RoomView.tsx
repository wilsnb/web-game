"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoom } from "@/lib/multiplayer/useRoom";
import { adaptRoomGame } from "@/lib/multiplayer/adapter";
import type { Quiz } from "@/lib/types";
import { GameBoard } from "@/components/GameBoard";
import { ResultsScreen } from "@/components/ResultsScreen";

/**
 * Room view driven entirely by the synced shared state, rendering the SAME
 * game UI as single-device:
 *  - lobby: players + settings; host sees "Start game"; anyone can copy the
 *    join link.
 *  - playing: the real GameBoard (title, progress, scores, history, feedback),
 *    with the guess input gated to the current player and a shared countdown.
 *  - finished: the real ResultsScreen (answer reveal + ratings + winner).
 *
 * "My id" is the auth id for logged-in players, or the locally-stored guestId
 * for guests — used to tell whether it's the viewer's turn.
 */
export function RoomView({
  code,
  quiz,
  viewerId,
}: {
  code: string;
  quiz: Quiz;
  viewerId: string | null;
}) {
  const { state, connected } = useRoom(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Effective identity: auth id, else the guest id saved on join.
  const [myId, setMyId] = useState<string | null>(viewerId);
  useEffect(() => {
    if (viewerId) {
      setMyId(viewerId);
    } else {
      setMyId(sessionStorage.getItem("qwardoo:guestId"));
    }
  }, [viewerId]);

  const host = state?.players.find((p) => p.isHost);
  const isHost = Boolean(myId && host && host.id === myId);

  // Auto-join for people who arrived via the shared invite link.
  //  - Signed-in visitors join automatically by their auth id.
  //  - Guests are prompted for a name first (guestNeedsName), then join.
  const inRoom = Boolean(myId && state?.players.some((p) => p.id === myId));
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  const autoJoin = useCallback(
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

  // Signed-in visitors who aren't members yet: join automatically once.
  const [autoJoined, setAutoJoined] = useState(false);
  useEffect(() => {
    if (!state) return;
    if (state.phase !== "lobby") return; // can't join a game already in progress
    if (inRoom || autoJoined) return;
    if (viewerId) {
      setAutoJoined(true);
      autoJoin();
    }
  }, [state, inRoom, autoJoined, viewerId, autoJoin]);

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
    const url = `${window.location.origin}/multiplayer/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore, the code is still visible */
    }
  }

  if (!state) {
    return <p className="font-haas text-at-body-md text-at-muted">Loading room…</p>;
  }

  // Playing / finished both render the real game components via the adapter.
  if ((state.phase === "playing" || state.phase === "finished") && state.game) {
    return (
      <MultiplayerGame
        code={code}
        quiz={quiz}
        room={state}
        myId={myId}
        isHost={isHost}
      />
    );
  }

  // LOBBY
  return (
    <div className="flex flex-col gap-lg">
      {/* Code + connection + copy link */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
          Room code
        </p>
        <p className="font-haas text-at-display-md tracking-widest text-at-ink">
          {code}
        </p>
        <p className="mt-xs font-haas text-at-caption text-at-muted">
          {connected ? "🟢 Live" : "Connecting…"} · Waiting to start
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-sm inline-flex h-[36px] items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-md font-haas text-at-caption font-medium text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          {copied ? "Link copied ✓" : "Copy invite link"}
        </button>
      </div>

      {/* Guest link-visitor who hasn't joined yet: prompt for a name. */}
      {!inRoom && !viewerId && (
        <div className="motion-rise rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <p className="font-haas text-at-body-md text-at-ink">
            Join this room to play
          </p>
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
              onClick={() => autoJoin(joinName.trim())}
              className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
          {error && (
            <p className="motion-fade mt-sm font-haas text-at-body-md text-at-coral">
              {error}
            </p>
          )}
        </div>
      )}

      <PlayersCard players={state.players} myId={myId} />

      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <p className="font-haas text-at-body-md text-at-ink">
          {state.settings.rounds} rounds · {state.settings.guessesPerRound}{" "}
          guesses per round · {state.settings.turnSeconds}s per turn
        </p>
        {isHost ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="mt-md inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft will-change-transform hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
            >
              {busy ? "Starting…" : "Start game"}
            </button>
            {error && (
              <p className="motion-fade mt-sm font-haas text-at-body-md text-at-coral">
                {error}
              </p>
            )}
          </>
        ) : (
          <p className="mt-md font-haas text-at-body-md text-at-muted">
            Waiting for the host to start…
          </p>
        )}
      </div>
    </div>
  );
}

function PlayersCard({
  players,
  myId,
}: {
  players: { id: string; name: string; isHost: boolean; isGuest: boolean }[];
  myId: string | null;
}) {
  return (
    <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
      <h2 className="font-haas text-at-title-md font-normal text-at-ink">
        Players ({players.length})
      </h2>
      <ul className="mt-sm flex flex-col gap-xs">
        {players.map((p) => (
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
    </div>
  );
}

/**
 * The live/finished multiplayer game. Adapts the shared RoomGame into the
 * single-device GameState/GameSettings and renders the REAL GameBoard /
 * ResultsScreen so multiplayer looks identical to solo play.
 */
function MultiplayerGame({
  code,
  quiz,
  room,
  myId,
  isHost,
}: {
  code: string;
  quiz: Quiz;
  room: ReturnType<typeof useRoom>["state"] & object;
  myId: string | null;
  isHost: boolean;
}) {
  const game = room.game!;
  const { state, settings, playerIds } = adaptRoomGame(room, game);

  const currentPlayerId = playerIds[game.currentIndex];
  const myTurn = myId === currentPlayerId;
  const currentName =
    game.scores.find((s) => s.playerId === currentPlayerId)?.name ?? "player";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared countdown to the server deadline — same value on every device.
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((game.turnEndsAt - Date.now()) / 1000))
  );
  const [firedFor, setFiredFor] = useState<number | null>(null);

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((game.turnEndsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [game.turnEndsAt]);

  // Any client reports the timeout once the deadline passes; server re-validates.
  useEffect(() => {
    if (room.phase !== "playing") return;
    if (remaining > 0) return;
    if (firedFor === game.turnEndsAt) return;
    setFiredFor(game.turnEndsAt);
    const guestId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
        : undefined;
    fetch("/api/rooms/timeout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, guestId }),
    }).catch(() => {});
  }, [remaining, game.turnEndsAt, firedFor, code, room.phase]);

  const send = useCallback(
    async (action: "guess" | "skip", guess?: string) => {
      setBusy(true);
      setError(null);
      const guestId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
          : undefined;
      const res = await fetch("/api/rooms/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action, guess, guestId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Could not send.");
      }
      setBusy(false);
    },
    [code]
  );

  const onGuess = useCallback((g: string) => send("guess", g), [send]);
  const onSkip = useCallback(() => send("skip"), [send]);

  async function hostSkip() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms/timeout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Could not skip.");
    }
    setBusy(false);
  }

  // FINISHED — the real results screen (answer reveal + ratings + winner).
  // onReplay is omitted: multiplayer replays happen by creating a new room.
  if (room.phase === "finished") {
    return <ResultsScreen quiz={quiz} state={state} isSignedIn={Boolean(myId)} />;
  }

  // PLAYING — the real GameBoard, input gated to the current player.
  const lowTime = remaining <= 5;
  const timerNode = (
    <div className="mx-auto flex w-fit items-center gap-sm rounded-pill border border-divider-soft bg-canvas px-md py-[8px]">
      <span className="text-caption text-ink-muted-48">Time left</span>
      <span
        className={`text-tagline font-semibold tabular-nums ${
          lowTime ? "text-primary" : "text-ink-muted-80"
        }`}
        role="timer"
        aria-live="off"
      >
        {remaining}s
      </span>
    </div>
  );

  const waitingNode = (
    <p className="text-body-apple text-ink-muted-80">
      Waiting for <span className="font-semibold text-ink">{currentName}</span>{" "}
      to guess…
    </p>
  );

  const extraControls = (
    <>
      {isHost && !myTurn && (
        <button
          type="button"
          disabled={busy}
          onClick={hostSkip}
          className="inline-flex h-[40px] items-center justify-center rounded-pill border border-divider-soft bg-canvas px-md font-haas text-caption font-medium text-ink transition-all duration-base ease-soft hover:border-primary hover:text-primary disabled:opacity-60"
        >
          Skip {currentName}
        </button>
      )}
      {error && (
        <p className="motion-fade text-caption text-primary" role="alert">
          {error}
        </p>
      )}
    </>
  );

  return (
    <GameBoard
      quiz={quiz}
      settings={settings}
      state={state}
      onGuess={onGuess}
      onSkip={onSkip}
      interactive={myTurn && !busy}
      timerNode={timerNode}
      waitingNode={waitingNode}
      extraControls={extraControls}
    />
  );
}
