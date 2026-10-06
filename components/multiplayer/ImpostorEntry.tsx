"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  normalizeCode,
  isValidCode,
  newGuestId,
  IMPOSTOR_GAME_ID,
} from "@/lib/multiplayer/room";

/**
 * Entry for "Who is the Impostor" — a multiplayer-only game (3+ players).
 * Host a room (must be signed in) or join one by code. Mirrors the solo-race
 * online entry but with no solo option.
 */
export function ImpostorEntry({ isSignedIn }: { isSignedIn: boolean }) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    if (!isSignedIn) {
      router.push(`/login?next=/play/${IMPOSTOR_GAME_ID}`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: IMPOSTOR_GAME_ID }),
    });
    if (res.ok) {
      const { code } = await res.json();
      router.push(`/multiplayer/${code}`);
    } else {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Could not create room.");
      setBusy(false);
    }
  }

  async function joinRoom() {
    const c = normalizeCode(joinCode);
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
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Could not join room.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-content px-lg py-section">
      <header className="mb-xl flex flex-col gap-sm">
        <h1 className="text-display-lg font-semibold tracking-tight text-ink">
          Who is the Impostor
        </h1>
        <p className="text-body-apple text-ink-muted-80">
          Everyone gets a secret word — except the impostor, who gets a lookalike.
          Give clues, then vote out who you think is faking. 3+ players, on your
          own devices.
        </p>
      </header>

      <div className="flex flex-col gap-lg">
        <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
          <h2 className="text-tagline font-semibold text-ink">Host a game</h2>
          <p className="mt-xxs text-caption text-ink-muted-48">
            {isSignedIn
              ? "Create a room and share the code or link with your group."
              : "You need to be signed in to host a game."}
          </p>
          <div className="mt-md flex justify-center">
            <button
              type="button"
              disabled={busy}
              onClick={createRoom}
              className="press-scale focus-ring inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0 disabled:opacity-60"
            >
              {isSignedIn ? (busy ? "Creating…" : "Create room") : "Sign in to host"}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
          <h2 className="text-tagline font-semibold text-ink">Join a game</h2>
          <div className="mt-md flex flex-col gap-sm">
            {!isSignedIn && (
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={24}
                placeholder="Your name"
                className="focus-ring h-[44px] w-full rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink transition-all duration-base ease-soft"
              />
            )}
            <div className="flex flex-col gap-sm sm:flex-row">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="CODE"
                className="focus-ring h-[44px] w-full max-w-[160px] rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-strong uppercase tracking-widest text-ink transition-all duration-base ease-soft"
              />
              <button
                type="button"
                disabled={busy}
                onClick={joinRoom}
                className="press-scale focus-ring inline-flex h-[44px] min-w-[140px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus active:translate-y-0 disabled:opacity-60"
              >
                {busy ? "Joining…" : "Join room"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <p className="motion-fade mt-md text-center text-body-apple text-primary" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
