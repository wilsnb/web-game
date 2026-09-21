"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeCode, isValidCode, newGuestId } from "@/lib/multiplayer/room";

/**
 * Create a room (host, must be logged in) or join one by code (anyone).
 * Guests joining provide a display name; we store a guest id locally so their
 * identity persists on the room page.
 */
export function MultiplayerLanding({
  isSignedIn,
  quizzes,
}: {
  isSignedIn: boolean;
  quizzes: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [guestName, setGuestName] = useState("");

  // Host settings.
  const [quizId, setQuizId] = useState(quizzes[0]?.id ?? "");
  const [rounds, setRounds] = useState(3);
  const [guessesPerRound, setGuessesPerRound] = useState(3);
  const [turnSeconds, setTurnSeconds] = useState(30);

  async function createRoom() {
    if (!isSignedIn) {
      router.push("/login?next=/multiplayer");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, rounds, guessesPerRound, turnSeconds }),
    });
    if (res.ok) {
      const { code } = await res.json();
      router.push(`/multiplayer/${code}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not create room.");
      setBusy(false);
    }
  }

  async function joinRoom() {
    const c = normalizeCode(code);
    if (!isValidCode(c)) {
      setError("Enter a valid 4-character room code.");
      return;
    }
    if (!isSignedIn && !guestName.trim()) {
      setError("Enter your name to join.");
      return;
    }
    setBusy(true);
    setError(null);

    // Guests get a persistent local id so the room knows who they are.
    let guestId = "";
    if (!isSignedIn) {
      guestId = sessionStorage.getItem("qwardoo:guestId") || newGuestId();
      sessionStorage.setItem("qwardoo:guestId", guestId);
      sessionStorage.setItem("qwardoo:guestName", guestName.trim());
    }

    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c, guestName: guestName.trim(), guestId }),
    });
    if (res.ok) {
      router.push(`/multiplayer/${c}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not join room.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Create */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
          Host a room
        </h2>
        <p className="mt-xxs font-haas text-at-body-md text-at-muted">
          {isSignedIn
            ? "Pick a quiz, set the rules, and share the code with friends."
            : "You need to be signed in to host a room."}
        </p>

        {isSignedIn && (
          <div className="mt-md flex flex-col gap-sm">
            <label className="font-haas text-at-body-md text-at-ink">
              Quiz
              <select
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                className="mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-md">
              <label className="flex-1 font-haas text-at-body-md text-at-ink">
                Rounds
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
                />
              </label>
              <label className="flex-1 font-haas text-at-body-md text-at-ink">
                Guesses / round
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={guessesPerRound}
                  onChange={(e) => setGuessesPerRound(Number(e.target.value))}
                  className="mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
                />
              </label>
            </div>

            <label className="font-haas text-at-body-md text-at-ink">
              Turn timer
              <select
                value={turnSeconds}
                onChange={(e) => setTurnSeconds(Number(e.target.value))}
                className="mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
              >
                <option value={15}>15 seconds per turn</option>
                <option value={20}>20 seconds per turn</option>
                <option value={30}>30 seconds per turn</option>
                <option value={45}>45 seconds per turn</option>
                <option value={60}>60 seconds per turn</option>
                <option value={90}>90 seconds per turn</option>
                <option value={120}>120 seconds per turn</option>
              </select>
            </label>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={createRoom}
          className="mt-md inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft will-change-transform hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
        >
          {isSignedIn ? "Create room" : "Sign in to host"}
        </button>
      </div>

      {/* Join */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
        <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
          Join a room
        </h2>
        <div className="mt-md flex flex-col gap-sm">
          {!isSignedIn && (
            <label className="font-haas text-at-body-md text-at-ink">
              Your name
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={24}
                placeholder="e.g. Alex"
                className="mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
              />
            </label>
          )}
          <label className="font-haas text-at-body-md text-at-ink">
            Room code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="X7K2"
              className="mt-xxs h-[44px] w-full max-w-[160px] rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-title-md uppercase tracking-widest text-at-ink transition-all duration-base ease-soft focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={joinRoom}
            className="inline-flex h-[44px] w-fit items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg font-haas text-at-button font-medium text-at-ink transition-all duration-base ease-soft will-change-transform hover:border-at-border-strong hover:shadow-at-card hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60 disabled:translate-y-0"
          >
            Join room
          </button>
        </div>
      </div>

      {error && (
        <p className="motion-fade font-haas text-at-body-md text-at-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
