"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SoloGame } from "./SoloGame";
import type { SoloGameMeta } from "@/lib/soloGames";
import { normalizeCode, isValidCode, newGuestId } from "@/lib/multiplayer/room";

/**
 * Entry for a solo skill game: play solo on this device, or host/join an online
 * "race" where everyone plays the identical challenge and compares scores.
 * Mirrors the quiz SetupForm online toggle. Solo play renders the game directly.
 */
export function SoloEntry({
  meta,
  isSignedIn,
}: {
  meta: SoloGameMeta;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"solo" | "online" | "playing">("solo");
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playing solo: just render the game (no seed / no room).
  if (mode === "playing") {
    return <SoloGame id={meta.id} />;
  }

  async function createRoom() {
    if (!isSignedIn) {
      router.push(`/login?next=/play/${meta.id}`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soloGameId: meta.id }),
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
          {meta.title}
        </h1>
        <p className="text-body-apple text-ink-muted-80">{meta.description}</p>
      </header>

      {/* Mode toggle */}
      <div className="mb-xl inline-flex rounded-pill border border-divider-soft bg-pearl p-[4px]">
        <button
          type="button"
          onClick={() => {
            setMode("solo");
            setError(null);
          }}
          className={`rounded-pill px-lg py-[10px] text-body-apple font-medium transition-all duration-base ease-soft ${
            mode === "solo"
              ? "bg-canvas text-ink shadow-at-card"
              : "text-ink-muted-48 hover:text-ink"
          }`}
        >
          Solo
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("online");
            setError(null);
          }}
          className={`rounded-pill px-lg py-[10px] text-body-apple font-medium transition-all duration-base ease-soft ${
            mode === "online"
              ? "bg-canvas text-ink shadow-at-card"
              : "text-ink-muted-48 hover:text-ink"
          }`}
        >
          Race friends online
        </button>
      </div>

      {mode === "solo" && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setMode("playing")}
            className="press-scale focus-ring inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
          >
            Play solo
          </button>
        </div>
      )}

      {mode === "online" && (
        <div className="flex flex-col gap-lg">
          <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
            <h2 className="text-tagline font-semibold text-ink">Host a race</h2>
            <p className="mt-xxs text-caption text-ink-muted-48">
              {isSignedIn
                ? "Everyone gets the exact same challenge. Share the code or link, then compare scores."
                : "You need to be signed in to host a race."}
            </p>
            <div className="mt-md flex justify-center">
              <button
                type="button"
                disabled={busy}
                onClick={createRoom}
                className="press-scale focus-ring inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0 disabled:opacity-60"
              >
                {isSignedIn ? (busy ? "Creating…" : "Create race") : "Sign in to host"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
            <h2 className="text-tagline font-semibold text-ink">Join a race</h2>
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
                  {busy ? "Joining…" : "Join race"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {error && (
        <p className="motion-fade mt-md text-center text-body-apple text-primary" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
