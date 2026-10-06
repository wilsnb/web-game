"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/lib/multiplayer/useRoom";
import type { ImpostorState } from "@/lib/multiplayer/room";

const EJECTION_REVEAL_SECONDS = 6;

/**
 * "Who is the Impostor" room. Hidden roles are fetched per-player from a
 * server endpoint (never streamed). Phases: lobby → reveal-role → clues →
 * voting → ejection → (impostor-guess) → results. Auto-advances when everyone
 * has acted; the host can force-advance a stuck phase.
 */
export function ImpostorRoomView({
  code,
  viewerId,
}: {
  code: string;
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

  const guestId = () =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
      : undefined;

  // ---- Join / lobby helpers ----
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  const join = useCallback(
    async (guestName?: string) => {
      setJoining(true);
      setError(null);
      let gid = "";
      if (!viewerId) {
        gid = sessionStorage.getItem("qwardoo:guestId") || "";
        if (!gid) {
          gid = "guest_" + Math.random().toString(36).slice(2, 10);
          sessionStorage.setItem("qwardoo:guestId", gid);
        }
        if (guestName) sessionStorage.setItem("qwardoo:guestName", guestName);
        setMyId(gid);
      }
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, guestName: guestName ?? "", guestId: gid }),
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
    const res = await fetch("/api/rooms/impostor/start", {
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
      /* ignore */
    }
  }

  // ---- Generic action poster ----
  const act = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      const res = await fetch("/api/rooms/impostor/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action, guestId: guestId(), ...extra }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Action failed.");
        return false;
      }
      setError(null);
      return true;
    },
    [code]
  );

  if (!state) {
    return <p className="font-haas text-at-body-md text-at-muted">Loading room…</p>;
  }

  const imp = state.impostor;

  // ---- LOBBY ----
  if (state.phase === "lobby" || !imp) {
    return (
      <Lobby
        code={code}
        connected={connected}
        players={state.players}
        myId={myId}
        isHost={isHost}
        inRoom={inRoom}
        viewerId={viewerId}
        joinName={joinName}
        setJoinName={setJoinName}
        joining={joining}
        onJoin={join}
        onStart={start}
        onCopy={copyLink}
        copied={copied}
        busy={busy}
        error={error}
      />
    );
  }

  // ---- IN-GAME PHASES ----
  return (
    <div className="flex flex-col gap-lg">
      <GamePhase
        code={code}
        imp={imp}
        myId={myId}
        isHost={isHost}
        act={act}
      />
      {error && (
        <p className="motion-fade font-haas text-at-body-md text-at-coral" role="alert">
          {error}
        </p>
      )}
      {isHost && imp.phase !== "results" && (
        <button
          type="button"
          onClick={() => act("advance")}
          className="mx-auto font-haas text-at-caption text-at-muted underline transition-colors hover:text-at-ink"
        >
          Host: skip ahead
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase router                                                        */
/* ------------------------------------------------------------------ */

function GamePhase({
  code,
  imp,
  myId,
  isHost,
  act,
}: {
  code: string;
  imp: ImpostorState;
  myId: string | null;
  isHost: boolean;
  act: (action: string, extra?: Record<string, unknown>) => Promise<boolean>;
}) {
  switch (imp.phase) {
    case "reveal-role":
      return <RoleReveal code={code} imp={imp} myId={myId} act={act} />;
    case "clues":
      return <Clues imp={imp} myId={myId} act={act} />;
    case "voting":
      return <Voting imp={imp} myId={myId} act={act} />;
    case "ejection":
      return <Ejection imp={imp} myId={myId} act={act} />;
    case "impostor-guess":
      return <ImpostorGuess code={code} imp={imp} myId={myId} act={act} />;
    case "results":
      return <Results imp={imp} myId={myId} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Phase 1: private role reveal (fetch only MY card)                   */
/* ------------------------------------------------------------------ */

function RoleReveal({
  code,
  imp,
  myId,
  act,
}: {
  code: string;
  imp: ImpostorState;
  myId: string | null;
  act: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
}) {
  const [role, setRole] = useState<{ isImpostor: boolean; word: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/rooms/impostor/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        guestId:
          typeof window !== "undefined"
            ? sessionStorage.getItem("qwardoo:guestId") ?? undefined
            : undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setRole({ isImpostor: d.isImpostor, word: d.word });
      });
    return () => {
      active = false;
    };
  }, [code]);

  const readyCount = imp.ready.length;
  const total = imp.order.length;

  return (
    <div className="mx-auto w-full max-w-[440px] text-center">
      <p className="text-caption uppercase tracking-wide text-ink-muted-48">
        Category: {imp.category}
      </p>
      {!role ? (
        <p className="mt-lg text-body-apple text-ink-muted-80">Dealing your card…</p>
      ) : (
        <div
          className={`motion-pop mt-md rounded-lg p-section text-center shadow-at-card ${
            role.isImpostor ? "bg-at-coral" : "bg-at-forest"
          }`}
        >
          {role.isImpostor ? (
            <>
              <p className="text-caption-strong font-semibold uppercase tracking-wide text-white/80">
                You are the impostor
              </p>
              <p className="mt-sm text-display-md font-semibold text-white">
                {role.word}
              </p>
              <p className="mt-sm text-body-apple text-white/90">
                That&apos;s your decoy word — blend in and don&apos;t get caught.
              </p>
            </>
          ) : (
            <>
              <p className="text-caption-strong font-semibold uppercase tracking-wide text-white/80">
                Your secret word
              </p>
              <p className="mt-sm text-display-md font-semibold text-white">
                {role.word}
              </p>
              <p className="mt-sm text-body-apple text-white/90">
                Give a clue that proves you know it — without giving it away.
              </p>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!role || ready}
        onClick={async () => {
          const ok = await act("ready");
          if (ok) setReady(true);
        }}
        className="press-scale focus-ring mt-lg inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus active:translate-y-0 disabled:opacity-60"
      >
        {ready ? "Waiting for others…" : "I'm ready"}
      </button>
      <p className="mt-sm text-caption text-ink-muted-48">
        {readyCount} / {total} ready
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase 2: clues (turn-based typed clues, shown live)                 */
/* ------------------------------------------------------------------ */

function Clues({
  imp,
  myId,
  act,
}: {
  imp: ImpostorState;
  myId: string | null;
  act: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const currentId = imp.clueOrder[imp.clueIndex];
  const myTurn = myId === currentId;
  const amLiving = myId ? imp.living.includes(myId) : false;

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <p className="text-center text-caption uppercase tracking-wide text-ink-muted-48">
        Round {imp.round} · Clue phase · Category: {imp.category}
      </p>

      <div className="mt-md rounded-lg border border-divider-soft bg-canvas p-lg text-center shadow-at-card">
        {!amLiving ? (
          <p className="text-body-apple text-ink-muted-80">
            You&apos;ve been voted out — watching as a spectator.
          </p>
        ) : myTurn ? (
          <>
            <p className="text-body-apple font-medium text-primary">
              Your turn — give a one-word-ish clue
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                const ok = await act("clue", { text: text.trim() });
                if (ok) setText("");
              }}
              className="mt-md flex flex-col gap-sm sm:flex-row"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={40}
                autoFocus
                placeholder="Your clue…"
                className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink transition-all duration-base ease-soft focus:border-primary"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="h-[44px] rounded-pill bg-primary px-lg text-body-apple text-white disabled:opacity-60"
              >
                Submit
              </button>
            </form>
          </>
        ) : (
          <p className="text-body-apple text-ink-muted-80">
            Waiting for{" "}
            <span className="font-semibold text-ink">
              {currentId && nameFromOrder(imp, currentId)}
            </span>{" "}
            to give a clue…
          </p>
        )}
      </div>

      <ClueList imp={imp} myId={myId} />
    </div>
  );
}

function ClueList({ imp, myId }: { imp: ImpostorState; myId: string | null }) {
  if (imp.clues.length === 0) {
    return (
      <p className="mt-md rounded-md border border-dashed border-divider-soft p-md text-center text-caption text-ink-muted-48">
        No clues yet.
      </p>
    );
  }
  return (
    <ul className="mt-md flex flex-col gap-xs">
      {imp.clues.map((c, i) => (
        <li
          key={i}
          className="motion-rise flex items-center justify-between rounded-md border border-divider-soft bg-canvas px-md py-sm text-body-apple"
        >
          <span className="text-caption font-semibold text-ink-muted-80">
            {c.name}
            {c.playerId === myId ? " (you)" : ""}
          </span>
          <span className="font-medium text-ink">&ldquo;{c.text}&rdquo;</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Phase 3: voting                                                     */
/* ------------------------------------------------------------------ */

function Voting({
  imp,
  myId,
  act,
}: {
  imp: ImpostorState;
  myId: string | null;
  act: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
}) {
  const myVote = myId ? imp.votes[myId] : undefined;
  const votedCount = Object.keys(imp.votes).length;
  const amLiving = myId ? imp.living.includes(myId) : false;

  // Live breakdown: suspectId -> list of voter names (shown as votes come in).
  const voteBreakdown: Record<string, string[]> = {};
  for (const [voterId, suspectId] of Object.entries(imp.votes)) {
    (voteBreakdown[suspectId] ??= []).push(nameFromOrder(imp, voterId));
  }

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <p className="text-center text-caption uppercase tracking-wide text-ink-muted-48">
        Round {imp.round} · {amLiving ? "Who's the impostor? Tap to vote." : "Spectating — the living players are voting."}
      </p>

      <ClueList imp={imp} myId={myId} />

      <div className="mt-lg grid grid-cols-2 gap-sm">
        {imp.living.map((pid) => {
          const name = nameFromOrder(imp, pid);
          const picked = myVote === pid;
          const voters = voteBreakdown[pid] ?? [];
          return (
            <button
              key={pid}
              type="button"
              disabled={!amLiving || pid === myId}
              onClick={() => act("vote", { suspectId: pid })}
              className={`focus-ring flex min-h-[56px] flex-col items-center justify-center rounded-lg border p-md text-body-strong font-semibold transition-all duration-fast ease-soft disabled:opacity-40 ${
                picked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-divider-soft bg-canvas text-ink hover:border-primary"
              }`}
            >
              <span>
                {name}
                {pid === myId ? " (you)" : ""}
              </span>
              {voters.length > 0 && (
                <span className="mt-xxs text-caption font-normal text-ink-muted-48">
                  {voters.join(", ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-md text-center text-caption text-ink-muted-48">
        {votedCount} / {imp.living.length} voted
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase 4: ejection reveal (auto-advances)                            */
/* ------------------------------------------------------------------ */

function Ejection({
  imp,
  myId,
  act,
}: {
  imp: ImpostorState;
  myId: string | null;
  act: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
}) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const t = setTimeout(() => act("next"), EJECTION_REVEAL_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [act]);

  const ejectedName = imp.ejectedId ? nameFromOrder(imp, imp.ejectedId) : null;

  return (
    <div className="mx-auto w-full max-w-[440px] text-center">
      <div className="motion-pop rounded-lg border border-divider-soft bg-canvas p-section shadow-at-card">
        {!imp.ejectedId ? (
          <p className="text-tagline font-semibold text-ink">
            The vote was tied — nobody was ejected.
          </p>
        ) : (
          <>
            <p className="text-body-apple text-ink-muted-80">
              The group voted out
            </p>
            <p className="mt-xs text-display-md font-semibold text-ink">
              {ejectedName}
              {imp.ejectedId === myId ? " (you)" : ""}
            </p>
            <p
              className={`mt-sm text-tagline font-semibold ${
                imp.ejectedWasImpostor ? "text-at-success" : "text-at-coral"
              }`}
            >
              {imp.ejectedWasImpostor
                ? "…who WAS an impostor!"
                : "…who was NOT an impostor."}
            </p>
          </>
        )}
      </div>
      <p className="mt-md text-caption text-ink-muted-48">Continuing…</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase 5: ejected impostor's word guess                              */
/* ------------------------------------------------------------------ */

function ImpostorGuess({
  code,
  imp,
  myId,
  act,
}: {
  code: string;
  imp: ImpostorState;
  myId: string | null;
  act: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
}) {
  const [word, setWord] = useState("");
  const amEjected = myId === imp.ejectedId;

  return (
    <div className="mx-auto w-full max-w-[440px] text-center">
      <p className="text-caption uppercase tracking-wide text-ink-muted-48">
        Last chance for the impostor
      </p>
      {amEjected ? (
        <>
          <p className="mt-sm text-body-apple text-ink-muted-80">
            You were caught! Guess the group&apos;s real word to steal the win.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (word.trim()) act("guess", { word: word.trim() });
            }}
            className="mt-md flex flex-col gap-sm sm:flex-row"
          >
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoFocus
              placeholder="The group's word…"
              className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink transition-all duration-base ease-soft focus:border-primary"
            />
            <button
              type="submit"
              disabled={!word.trim()}
              className="h-[44px] rounded-pill bg-primary px-lg text-body-apple text-white disabled:opacity-60"
            >
              Guess
            </button>
          </form>
        </>
      ) : (
        <p className="mt-lg text-body-apple text-ink-muted-80">
          The ejected impostor is guessing the word…
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase 6: results                                                    */
/* ------------------------------------------------------------------ */

function Results({ imp, myId }: { imp: ImpostorState; myId: string | null }) {
  const r = imp.result;
  return (
    <div className="mx-auto w-full max-w-[440px] text-center">
      <p className="text-caption uppercase tracking-wide text-ink-muted-48">
        Game over
      </p>
      <h2 className="motion-pop mt-xs text-display-md font-semibold text-ink">
        {r?.winner === "impostors" ? "Impostors win!" : "The crew wins!"}
      </h2>
      {r?.reason && (
        <p className="mt-sm text-body-apple text-ink-muted-80">{r.reason}</p>
      )}
      {imp.revealWord && (
        <p className="mt-sm text-body-apple text-ink">
          The word was <span className="font-semibold">{imp.revealWord}</span>.
        </p>
      )}

      <ul className="mx-auto mt-lg flex max-w-[360px] flex-col text-left">
        {r?.roles.map((role) => (
          <li
            key={role.playerId}
            className="flex items-center justify-between border-b border-divider-soft py-sm text-body-apple text-ink last:border-b-0"
          >
            <span>
              {role.name}
              {role.playerId === myId ? " (you)" : ""}
            </span>
            <span
              className={`text-caption font-semibold ${
                role.wasImpostor ? "text-at-coral" : "text-ink-muted-48"
              }`}
            >
              {role.wasImpostor ? "Impostor" : "Crew"}
            </span>
          </li>
        ))}
      </ul>

      <a
        href="/play/who-is-the-impostor"
        className="press-scale focus-ring mt-lg inline-flex h-[44px] items-center justify-center rounded-pill border border-primary px-lg text-body-apple text-primary no-underline transition-all duration-base ease-soft hover:-translate-y-[1px] active:translate-y-0"
      >
        New game
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lobby                                                               */
/* ------------------------------------------------------------------ */

function Lobby(props: {
  code: string;
  connected: boolean;
  players: { id: string; name: string; isHost: boolean; isGuest: boolean }[];
  myId: string | null;
  isHost: boolean;
  inRoom: boolean;
  viewerId: string | null;
  joinName: string;
  setJoinName: (v: string) => void;
  joining: boolean;
  onJoin: (name?: string) => void;
  onStart: () => void;
  onCopy: () => void;
  copied: boolean;
  busy: boolean;
  error: string | null;
}) {
  const {
    code,
    connected,
    players,
    myId,
    isHost,
    inRoom,
    viewerId,
    joinName,
    setJoinName,
    joining,
    onJoin,
    onStart,
    onCopy,
    copied,
    busy,
    error,
  } = props;

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
          {connected ? "🟢 Live" : "Connecting…"} · Everyone gets a secret word
          — except the impostor. Give clues, then vote.
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="mt-sm inline-flex h-[36px] items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-md font-haas text-at-caption font-medium text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:shadow-at-card"
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
              onClick={() => onJoin(joinName.trim())}
              className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </div>
      )}

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

        {isHost ? (
          <>
            <button
              type="button"
              disabled={busy || players.length < 3}
              onClick={onStart}
              className="mt-md inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
            >
              {busy ? "Starting…" : "Start game"}
            </button>
            {players.length < 3 && (
              <p className="mt-sm font-haas text-at-caption text-at-muted">
                Need at least 3 players to start.
              </p>
            )}
          </>
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

/** Resolve a player's display name from the clue list or fall back to id. */
function nameFromOrder(imp: ImpostorState, playerId: string): string {
  const fromClue = imp.clues.find((c) => c.playerId === playerId);
  if (fromClue) return fromClue.name;
  return playerId.startsWith("guest_") ? "Guest" : "Player";
}
