"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Quiz } from "@/lib/types";
import type { GameSettings, GameState } from "@/lib/gameState";
import { createInitialState, makeReducer } from "@/lib/gameState";
import { SetupForm } from "./SetupForm";
import { GameBoard } from "./GameBoard";
import { ResultsScreen } from "./ResultsScreen";

type Screen = "setup" | "play" | "results";

/**
 * Orchestrates the three in-page states for one quiz.
 * Cross-category navigation stays a full page load (handled by <Link> elsewhere);
 * only these three states transition client-side.
 */
export function GameClient({ quiz }: { quiz: Quiz }) {
  const [screen, setScreen] = useState<Screen>("setup");
  const [settings, setSettings] = useState<GameSettings | null>(null);

  return (
    <>
      {screen === "setup" && (
        <SetupForm
          quiz={quiz}
          onStart={(s) => {
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
  onFinished,
  onReplay,
}: {
  quiz: Quiz;
  settings: GameSettings;
  screen: Screen;
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

  if (screen === "results" || state.phase === "finished") {
    return (
      <ResultsScreen
        quiz={quiz}
        state={state}
        onReplay={() => {
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
