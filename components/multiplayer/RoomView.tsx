"use client";

import { useEffect, useState } from "react";
import { useRoom } from "@/lib/multiplayer/useRoom";
import type { RoomGame } from "@/lib/multiplayer/room";

/**
 * Room view driven entirely by the synced shared state.
 *  - lobby: players + settings; host sees "Start game".
 *  - playing: whose-turn banner; the current player gets a guess input, others
 *    see a waiting state; live scoreboard + progress + guess history.
 *  - finished: shared final scoreboard + winner.
 *
 * "My id" is the auth id for logged-in players, or the locally-stored guestId
 * for guests — used to tell whether it's the viewer's turn.
 */
export function RoomView({
  code,
  viewerId,
}: {
  code: string;
  viewerId: string | null;
}) {
  const { state, connected } = useRoom(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!state) {
    return <p className="font-haas text-at-body-md text-at-muted">Loading room…</p>;
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Code + connection */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
          Room code
        </p>
        <p className="font-haas text-at-display-md tracking-widest text-at-ink">
          {code}
        </p>
        <p className="mt-xs font-haas text-at-caption text-at-muted">
          {connected ? "🟢 Live" : "Connecting…"} ·{" "}
          {state.phase === "lobby"
            ? "Waiting to start"
            : state.phase === "playing"
            ? "In progress"
            : "Finished"}
        </p>
      </div>

      {/* LOBBY */}
      {state.phase === "lobby" && (
        <>
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
                  className="mt-md inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-colors hover:bg-at-primary-active disabled:opacity-60"
                >
                  {busy ? "Starting…" : "Start game"}
                </button>
                {error && (
                  <p className="mt-sm font-haas text-at-body-md text-at-coral">
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
        </>
      )}

      {/* PLAYING */}
      {state.phase === "playing" && state.game && (
        <PlayingView
          code={code}
          game={state.game}
          myId={myId}
          isHost={isHost}
        />
      )}

      {/* FINISHED */}
      {state.phase === "finished" && state.game && (
        <FinishedView game={state.game} myId={myId} />
      )}
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

function Scoreboard({
  game,
  myId,
}: {
  game: RoomGame;
  myId: string | null;
}) {
  const currentId = game.order[game.currentIndex];
  return (
    <div className="flex flex-wrap gap-sm">
      {game.scores.map((s) => {
        const isCurrent = s.playerId === currentId;
        return (
          <div
            key={s.playerId}
            className={`min-w-[110px] flex-1 rounded-at-md border p-md text-center ${
              isCurrent
                ? "border-at-primary bg-at-primary/5"
                : "border-at-hairline bg-at-canvas"
            }`}
          >
            <div
              className={`truncate font-haas text-at-caption font-medium ${
                isCurrent ? "text-at-primary" : "text-at-muted"
              }`}
            >
              {s.name}
              {s.playerId === myId ? " (you)" : ""}
            </div>
            <div className="mt-xxs font-haas text-at-display-md tabular-nums text-at-ink">
              {s.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayingView({
  code,
  game,
  myId,
  isHost,
}: {
  code: string;
  game: RoomGame;
  myId: string | null;
  isHost: boolean;
}) {
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentId = game.order[game.currentIndex];
  const current = game.scores.find((s) => s.playerId === currentId);
  const myTurn = myId === currentId;

  // Shared countdown to the server deadline. Every client renders the same
  // number because turnEndsAt is an absolute timestamp in shared state.
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((game.turnEndsAt - Date.now()) / 1000))
  );
  // Guard so only one timeout request is fired per turn per client.
  const [firedFor, setFiredFor] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((game.turnEndsAt - Date.now()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [game.turnEndsAt]);

  // When the deadline passes, any client reports the timeout; the server
  // re-validates it actually expired before skipping. We fire at most once per
  // turn (keyed by turnEndsAt) to avoid a flood of requests.
  useEffect(() => {
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
    }).catch(() => {
      /* another client likely won the race; ignore */
    });
  }, [remaining, game.turnEndsAt, firedFor, code]);

  async function send(action: "guess" | "skip") {
    if (busy) return;
    setBusy(true);
    setError(null);
    const guestId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
        : undefined;
    const res = await fetch("/api/rooms/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        action,
        guess: action === "guess" ? guess.trim() : undefined,
        guestId,
      }),
    });
    if (res.ok) {
      setGuess("");
    } else {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Could not send.");
    }
    setBusy(false);
  }

  async function hostSkip() {
    if (busy) return;
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

  const lowTime = remaining <= 5;

  return (
    <div className="flex flex-col gap-lg">
      {/* Status */}
      <div className="flex items-center justify-between font-haas text-at-caption text-at-muted">
        <span>
          Round {game.round} of {game.rounds} · Guess {game.guessNumber} of{" "}
          {game.guessesPerRound}
        </span>
        <span>{game.totalFound} found</span>
      </div>

      {/* Turn timer */}
      <div className="flex items-center justify-between rounded-at-md border border-at-hairline bg-at-canvas px-md py-sm shadow-at-card">
        <span className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
          Time left
        </span>
        <span
          className={`font-haas text-at-title-md tabular-nums ${
            lowTime ? "text-at-coral" : "text-at-ink"
          }`}
          role="timer"
          aria-live="off"
        >
          {remaining}s
        </span>
      </div>

      {/* Turn / input */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg text-center shadow-at-card">
        {myTurn ? (
          <>
            <p className="font-haas text-at-body-md font-medium text-at-primary">
              Your turn — make a guess
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (guess.trim()) send("guess");
              }}
              className="mt-md flex flex-col gap-sm sm:flex-row"
            >
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                autoFocus
                placeholder="Type your guess…"
                className="h-[44px] flex-1 rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
              />
              <button
                type="submit"
                disabled={busy || !guess.trim()}
                className="h-[44px] rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark disabled:opacity-60"
              >
                Guess
              </button>
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={() => send("skip")}
              className="mt-sm font-haas text-at-caption text-at-link hover:text-at-link-active"
            >
              Pass / skip
            </button>
          </>
        ) : (
          <>
            <p className="font-haas text-at-body-md text-at-muted">
              Waiting for{" "}
              <span className="font-medium text-at-ink">{current?.name}</span> to
              guess…
            </p>
            {isHost && (
              <button
                type="button"
                disabled={busy}
                onClick={hostSkip}
                className="mt-md inline-flex h-[40px] items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-md font-haas text-at-caption font-medium text-at-ink transition-all hover:border-at-coral hover:text-at-coral disabled:opacity-60"
              >
                Skip {current?.name ?? "player"}
              </button>
            )}
          </>
        )}
        {error && (
          <p className="mt-sm font-haas text-at-body-md text-at-coral">{error}</p>
        )}
      </div>

      {/* Scores */}
      <div>
        <h3 className="mb-sm font-haas text-at-caption font-medium uppercase tracking-wide text-at-muted">
          Scores
        </h3>
        <Scoreboard game={game} myId={myId} />
      </div>

      {/* History */}
      <div>
        <h3 className="mb-sm font-haas text-at-caption font-medium uppercase tracking-wide text-at-muted">
          Guess history
        </h3>
        {game.history.length === 0 ? (
          <p className="rounded-at-md border border-dashed border-at-hairline p-md font-haas text-at-body-md text-at-muted">
            No guesses yet.
          </p>
        ) : (
          <ul className="flex max-h-[280px] flex-col gap-xs overflow-y-auto">
            {[...game.history].reverse().map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-sm rounded-at-md border border-at-hairline bg-at-canvas px-md py-sm font-haas text-at-body-md"
              >
                <span className="flex min-w-0 items-center gap-sm">
                  <span className="w-[80px] flex-none truncate text-at-caption font-medium text-at-muted">
                    {h.playerName}
                  </span>
                  <span className="truncate text-at-ink">
                    {h.skipped ? (
                      <span className="italic text-at-muted">passed</span>
                    ) : (
                      `"${h.guess}"`
                    )}
                  </span>
                </span>
                <span className="flex-none text-at-caption">
                  {h.correct ? (
                    <span className="font-medium text-at-success">
                      ✓ {h.matchedAnswer} · #{h.matchedRank} · +{h.points}
                    </span>
                  ) : h.alreadyClaimed ? (
                    <span className="text-at-muted">already found</span>
                  ) : h.skipped ? (
                    <span className="text-at-muted">—</span>
                  ) : (
                    <span className="text-at-muted">✗</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FinishedView({
  game,
  myId,
}: {
  game: RoomGame;
  myId: string | null;
}) {
  const sorted = [...game.scores].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  const winners = sorted.filter((s) => s.score === top);
  const isTie = winners.length > 1;

  return (
    <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg text-center shadow-at-card">
      <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
        Final results
      </p>
      <h2 className="mt-xs font-haas text-at-display-md font-normal text-at-ink">
        {isTie
          ? "It's a tie!"
          : `${winners[0]?.name ?? "Someone"} wins`}
      </h2>

      <ol className="mx-auto mt-lg flex max-w-[360px] flex-col text-left">
        {sorted.map((s, i) => (
          <li
            key={s.playerId}
            className="flex items-center justify-between border-b border-at-hairline py-sm font-haas text-at-body-md text-at-ink last:border-b-0"
          >
            <span>
              {i + 1}. {s.name}
              {s.playerId === myId ? " (you)" : ""}
            </span>
            <span className="font-medium">{s.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
