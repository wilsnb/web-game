"use client";

import { ReactionTime } from "./ReactionTime";
import { SpeedMath } from "./SpeedMath";
import { MemorySequence } from "./MemorySequence";
import { LogicPuzzle } from "./LogicPuzzle";
import { HigherLower } from "./HigherLower";
import { OddOneOut } from "./OddOneOut";

/** Maps a solo-game id to its component. */
export function SoloGame({ id }: { id: string }) {
  switch (id) {
    case "reaction-time-test":
      return <ReactionTime />;
    case "speed-math-challenge":
      return <SpeedMath />;
    case "memory-sequence":
      return <MemorySequence />;
    case "logic-pattern-puzzle":
      return <LogicPuzzle />;
    case "higher-or-lower":
      return <HigherLower />;
    case "odd-one-out":
      return <OddOneOut />;
    default:
      return null;
  }
}
