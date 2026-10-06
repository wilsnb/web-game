import type { RoundProvider } from "@/lib/solo/roundTypes";
import { logicProvider } from "./logicProvider";
import { oddOneOutProvider } from "./oddOneOutProvider";
import { speedMathProvider } from "./speedMathProvider";
import { higherLowerProvider } from "./higherLowerProvider";
import { reactionProvider } from "./reactionProvider";
import { memoryProvider } from "./memoryProvider";

/** game id -> round provider. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PROVIDERS: Record<string, RoundProvider<any>> = {
  "logic-pattern-puzzle": logicProvider,
  "odd-one-out": oddOneOutProvider,
  "speed-math-challenge": speedMathProvider,
  "higher-or-lower": higherLowerProvider,
  "reaction-time-test": reactionProvider,
  "memory-sequence": memoryProvider,
};

export function getProvider(id: string) {
  return PROVIDERS[id];
}
