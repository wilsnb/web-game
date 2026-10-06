"use client";

import { RoundGame, type RoundSync } from "./RoundGame";
import { getProvider } from "./providers";

/**
 * Renders a solo skill game as a 10-round game via the shared RoundGame engine.
 * Solo play passes no `sync`; online "race" play passes a RoundSync so rounds
 * are synchronized across devices with a shared seed + per-round leaderboard.
 */
export function SoloGame({ id, sync }: { id: string; sync?: RoundSync }) {
  const provider = getProvider(id);
  if (!provider) return null;
  return <RoundGame provider={provider} sync={sync} />;
}
