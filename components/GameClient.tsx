"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Quiz } from "@/lib/types";
import type { GameSettings, GameState } from "@/lib/gameState";
import { createInitialState, makeReducer } from "@/lib/gameState";
import {
  stashFinishedGame,
  loadFinishedGame,
  clearFinishedGame,
} from "@/lib/gameStash";
import { SetupForm } from "./SetupForm";
import { GameBoard } from "./GameBoard";
import { ResultsScreen } from "./ResultsScreen";

type Screen = "setup" | "play" | "results";

/**
 * Orchestrates the in-page states for one quiz. Also handles restoring a
 * finished game from localStorage — so if a guest finishes, leaves to log in
 * (from the reveal or rating), and returns, they land back on the exact
 * results screen instead of a restart.
 */
export function GameClient({
  quiz,
  isSignedIn = false,
}: {
  quiz: Quiz;
  isSignedIn?: boolean;
}) {
  const [screen, setScreen] = useState<Screen>("setup");
  const [settings, setSettings] = useState<GameSettings | null>(null);

  // A finished game restored from localStorage (e.g. after a login round-trip).
  const [restored, setRestored] = useState<GameState | null>(null);
  const [checkedStash, setCheckedStash] = useState(false);

  useEffect(() => {
    const stashed = loadFinishedGame(quiz.id);
    if (stashed) setRestored(stashed);
    setCheckedStash(true);
  }, [quiz.id]);

  // Avoid a flash of the setup form before we've checked localStorage.
  if (!checkedStash) return null;

  // Restored results screen (returned here after logging in mid-results).
  if (restored && screen === "setup") {
    return (
      <RestoredResults
        quiz={quiz}
        state={restored}
        isSignedIn={isSignedIn}
        onReplay={() => {
          clearFinishedGame(quiz.id);
          setRestored(null);
          setScreen("setup");
        }}
      />
    );
  }

  return (
    <>
      {screen === "setup" && (
        <SetupForm
          quiz={quiz}
          onStart={(s) => {
            // Starting fresh clears any old stashed result.
            clearFinishedGame(quiz.id);
            setSettings(s);
            setScreen("play");
          }}
        />
      )}
      {screen !== "setup" && settings && (
        <ActiveGame
          quiz={quiz}
          settings={settings}
          screen={screen}
          isSignedIn={isSignedIn}
          onFinished={() => setScreen("results")}
          onReplay={() => setScreen("setup")}
        />
      )}
    </>
  );
}

/**
 * Holds the reducer. Split out so the reducer is only created once we have settings.
 */
function ActiveGame({
  quiz,
  settings,
  screen,
  isSignedIn,
  onFinished,
  onReplay,
}: {
  quiz: Quiz;
  settings: GameSettings;
  screen: Screen;
  isSignedIn: boolean;
  onFinished: () => void;
  onReplay: () => void;
}) {
  const reducer = useMemo(() => makeReducer(quiz, settings), [quiz, settings]);
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createInitialState(quiz, settings) as GameState
  );

  const onGuess = useCallback((guess: string) => {
    dispatch({ type: "SUBMIT_GUESS", guess });
  }, []);

  const onSkip = useCallback(() => {
    dispatch({ type: "SKIP_GUESS" });
  }, []);

  // Surface results once the reducer reports the game is over.
  useEffect(() => {
    if (state.phase === "finished" && screen === "play") {
      onFinished();
    }
  }, [state.phase, screen, onFinished]);

  // Stash the finished game so a login round-trip can restore this exact screen.
  useEffect(() => {
    if (state.phase === "finished") {
      stashFinishedGame(quiz.id, state);
    }
  }, [state.phase, quiz.id, state]);

  if (screen === "results" || state.phase === "finished") {
    return (
      <ResultsScreen
        quiz={quiz}
        state={state}
        isSignedIn={isSignedIn}
        onReplay={() => {
          clearFinishedGame(quiz.id);
          dispatch({ type: "RESET" });
          onReplay();
        }}
      />
    );
  }

  return (
    <GameBoard
      quiz={quiz}
      settings={settings}
      state={state}
      onGuess={onGuess}
      onSkip={onSkip}
    />
  );
}

/** Renders a results screen rebuilt from a stashed finished game. */
function RestoredResults({
  quiz,
  state,
  isSignedIn,
  onReplay,
}: {
  quiz: Quiz;
  state: GameState;
  isSignedIn: boolean;
  onReplay: () => void;
}) {
  return (
    <ResultsScreen
      quiz={quiz}
      state={state}
      isSignedIn={isSignedIn}
      restored
      onReplay={onReplay}
    />
  );
}
