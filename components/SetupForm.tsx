"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameSettings } from "@/lib/gameState";
import type { Quiz } from "@/lib/types";
import { PrimaryButton } from "./Buttons";
import { normalizeCode, isValidCode, newGuestId } from "@/lib/multiplayer/room";

const MAX_TEAMS = 7;
const MIN_TEAMS = 1;
const MAX_ROUNDS = 10;
const MAX_GUESSES = 10;

/** Small stepper control (−/value/+) following the pill grammar. */
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-divider-soft py-md">
      <div className="flex flex-col">
        <span className="text-body-apple text-ink">{label}</span>
        {hint && <span className="text-caption text-ink-muted-48">{hint}</span>}
      </div>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full bg-pearl text-body-strong text-ink disabled:text-ink-muted-48"
        >
          −
        </button>
        <span className="w-[32px] text-center text-body-strong font-semibold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="press-scale focus-ring flex h-[44px] w-[44px] items-center justify-center rounded-full bg-pearl text-body-strong text-ink disabled:text-ink-muted-48"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SetupForm({
  quiz,
  isSignedIn = false,
  onStart,
}: {
  quiz: Quiz;
  isSignedIn?: boolean;
  onStart: (settings: GameSettings) => void;
}) {
  const router = useRouter();

  // "device" = classic pass-and-play on this device; "online" = create/join a
  // multiplayer room for THIS quiz.
  const [mode, setMode] = useState<"device" | "online">("device");

  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
    "Player 5",
    "Player 6",
    "Player 7",
  ]);
  const [rounds, setRounds] = useState(3);
  const [guessesPerRound, setGuessesPerRound] = useState(3);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Online-mode state.
  const [turnSeconds, setTurnSeconds] = useState(30);
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  async function createRoom() {
    if (!isSignedIn) {
      router.push(`/login?next=/play/${quiz.id}`);
      return;
    }
    setBusy(true);
    setMpError(null);
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: quiz.id,
        rounds,
        guessesPerRound,
        turnSeconds,
      }),
    });
    if (res.ok) {
      const { code } = await res.json();
      router.push(`/multiplayer/${code}`);
    } else {
      const d = await res.json().catch(() => null);
      setMpError(d?.error ?? "Could not create room.");
      setBusy(false);
    }
  }

  async function joinRoom() {
    const c = normalizeCode(joinCode);
    if (!isValidCode(c)) {
      setMpError("Enter a valid 4-character room code.");
      return;
    }
    if (!isSignedIn && !guestName.trim()) {
      setMpError("Enter your name to join.");
      return;
    }
    setBusy(true);
    setMpError(null);

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
      setMpError(d?.error ?? "Could not join room.");
      setBusy(false);
    }
  }

  function updateName(index: number, name: string) {
    setTeamNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }

  function handleStart() {
    const names = teamNames
      .slice(0, teamCount)
      .map((n, i) => (n.trim() ? n.trim() : `Player ${i + 1}`));
    onStart({
      teamNames: names,
      rounds,
      guessesPerRound,
      timerEnabled,
      timerSeconds,
    });
  }

  return (
    <div className="mx-auto w-full max-w-content px-lg py-section">
      <header className="mb-xl flex flex-col gap-sm">
        <span className="text-caption capitalize text-ink-muted-48">
          {quiz.category} · Top {quiz.listLength}
        </span>
        <h1 className="text-display-lg font-semibold tracking-tight text-ink">
          {quiz.title}
        </h1>
        <p className="text-body-apple text-ink-muted-80">
          Take turns guessing the ranked list. A correct guess closer to #1
          scores more — guessing #1 is worth {quiz.listLength} points, the last
          spot is worth 1.
        </p>
      </header>

      {/* Mode toggle: pass-and-play on one device vs online with friends */}
      <div className="mb-xl inline-flex rounded-pill border border-divider-soft bg-pearl p-[4px]">
        <button
          type="button"
          onClick={() => {
            setMode("device");
            setMpError(null);
          }}
          className={`rounded-pill px-lg py-[10px] text-body-apple font-medium transition-all duration-base ease-soft ${
            mode === "device"
              ? "bg-canvas text-ink shadow-at-card"
              : "text-ink-muted-48 hover:text-ink"
          }`}
        >
          On this device
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("online");
            setMpError(null);
          }}
          className={`rounded-pill px-lg py-[10px] text-body-apple font-medium transition-all duration-base ease-soft ${
            mode === "online"
              ? "bg-canvas text-ink shadow-at-card"
              : "text-ink-muted-48 hover:text-ink"
          }`}
        >
          Online with friends
        </button>
      </div>

      {/* DEVICE MODE — classic pass-and-play setup */}
      {mode === "device" && (
      <>
      <section className="mb-xl">
        <h2 className="mb-sm text-tagline font-semibold text-ink">
          Players
        </h2>
        <Stepper
          label="How many players?"
          value={teamCount}
          min={MIN_TEAMS}
          max={MAX_TEAMS}
          onChange={setTeamCount}
          hint={`${MIN_TEAMS}–${MAX_TEAMS} players`}
        />
        <div className="mt-lg flex flex-col gap-sm">
          {Array.from({ length: teamCount }).map((_, i) => (
            <label key={i} className="flex items-center gap-sm">
              <span className="w-[80px] text-caption text-ink-muted-48">
                Player {i + 1}
              </span>
              <input
                type="text"
                value={teamNames[i]}
                maxLength={24}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="focus-ring h-[44px] flex-1 rounded-pill border border-black/[0.08] bg-canvas px-[20px] text-body-apple text-ink"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="mb-sm text-tagline font-semibold text-ink">Rules</h2>
        <Stepper
          label="Rounds"
          value={rounds}
          min={1}
          max={MAX_ROUNDS}
          onChange={setRounds}
          hint="How many times play cycles through"
        />
        <Stepper
          label="Guesses per round, per player"
          value={guessesPerRound}
          min={1}
          max={MAX_GUESSES}
          onChange={setGuessesPerRound}
          hint="Taken one at a time, in rotation"
        />

        <div className="flex items-center justify-between border-b border-divider-soft py-md">
          <div className="flex flex-col">
            <span className="text-body-apple text-ink">Guess timer</span>
            <span className="text-caption text-ink-muted-48">
              Off by default — no time pressure
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={timerEnabled}
            aria-label="Toggle guess timer"
            onClick={() => setTimerEnabled((v) => !v)}
            className={`focus-ring relative h-[30px] w-[52px] rounded-pill transition-colors duration-base ease-soft ${
              timerEnabled ? "bg-primary" : "bg-hairline"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-at-card transition-all duration-base ease-spring ${
                timerEnabled ? "left-[25px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {timerEnabled && (
          <Stepper
            label="Seconds per guess"
            value={timerSeconds}
            min={5}
            max={120}
            onChange={(v) => setTimerSeconds(v)}
            hint="Time limit for each individual guess"
          />
        )}
      </section>
      </>
      )}

      {/* ONLINE MODE — host a room for this quiz or join a friend's */}
      {mode === "online" && (
        <div className="mb-xl flex flex-col gap-lg">
          {/* Host */}
          <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
            <h2 className="text-tagline font-semibold text-ink">
              Host a room
            </h2>
            <p className="mt-xxs text-caption text-ink-muted-48">
              {isSignedIn
                ? "Set the rules, then share the code or link with friends. Everyone plays on their own device."
                : "You need to be signed in to host a room."}
            </p>

            {isSignedIn && (
              <div className="mt-md">
                <Stepper
                  label="Rounds"
                  value={rounds}
                  min={1}
                  max={MAX_ROUNDS}
                  onChange={setRounds}
                  hint="How many times play cycles through"
                />
                <Stepper
                  label="Guesses per round, per player"
                  value={guessesPerRound}
                  min={1}
                  max={MAX_GUESSES}
                  onChange={setGuessesPerRound}
                  hint="Taken one at a time, in rotation"
                />
                <Stepper
                  label="Seconds per turn"
                  value={turnSeconds}
                  min={10}
                  max={120}
                  onChange={setTurnSeconds}
                  hint="Each player's turn auto-skips when time runs out"
                />
              </div>
            )}

            <div className="mt-md flex justify-center">
              <PrimaryButton
                onClick={createRoom}
                disabled={busy}
                className="min-w-[200px]"
              >
                {isSignedIn ? (busy ? "Creating…" : "Create room") : "Sign in to host"}
              </PrimaryButton>
            </div>
          </section>

          {/* Join */}
          <section className="rounded-lg border border-divider-soft bg-canvas p-lg">
            <h2 className="text-tagline font-semibold text-ink">Join a room</h2>
            <p className="mt-xxs text-caption text-ink-muted-48">
              Got a code from a friend? Enter it to join their game.
            </p>
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
                <PrimaryButton
                  onClick={joinRoom}
                  disabled={busy}
                  className="min-w-[140px]"
                >
                  {busy ? "Joining…" : "Join room"}
                </PrimaryButton>
              </div>
            </div>
          </section>

          {mpError && (
            <p className="motion-fade text-center text-body-apple text-primary" role="alert">
              {mpError}
            </p>
          )}
        </div>
      )}

      {/* Device-mode start button */}
      {mode === "device" && (
        <div className="flex justify-center">
          <PrimaryButton onClick={handleStart} className="min-w-[200px]">
            Start Game
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
