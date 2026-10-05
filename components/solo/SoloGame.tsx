import { ReactionTime } from "./ReactionTime";
import { SpeedMath } from "./SpeedMath";
import { MemorySequence } from "./MemorySequence";
import { LogicPuzzle } from "./LogicPuzzle";
import { HigherLower } from "./HigherLower";
import { OddOneOut } from "./OddOneOut";

/**
 * Props every solo game accepts. All optional, so single-player renders the
 * game exactly as before. In solo-race multiplayer the room passes a shared
 * `seed` (identical challenge for everyone), an `onFinish` to report the score,
 * `overExtra` (the leaderboard) + `multiplayer` to swap the game-over UI.
 */
export interface SoloGameProps {
  seed?: number;
  onFinish?: (score: number) => void;
  overExtra?: React.ReactNode;
  multiplayer?: boolean;
}

/** Maps a solo-game id to its component, forwarding the shared solo props. */
export function SoloGame({ id, ...props }: { id: string } & SoloGameProps) {
  switch (id) {
    case "reaction-time-test":
      return <ReactionTime {...props} />;
    case "speed-math-challenge":
      return <SpeedMath {...props} />;
    case "memory-sequence":
      return <MemorySequence {...props} />;
    case "logic-pattern-puzzle":
      return <LogicPuzzle {...props} />;
    case "higher-or-lower":
      return <HigherLower {...props} />;
    case "odd-one-out":
      return <OddOneOut {...props} />;
    default:
      return null;
  }
}
