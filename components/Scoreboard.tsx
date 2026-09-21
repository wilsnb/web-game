import type { Team } from "@/lib/gameState";
import { rankedTeams } from "@/lib/gameState";

/**
 * Running scoreboard. Optionally highlights the team whose turn it is.
 * On dark surfaces pass `onDark`.
 */
export function Scoreboard({
  teams,
  currentTeamId,
  onDark = false,
}: {
  teams: Team[];
  currentTeamId?: number;
  onDark?: boolean;
}) {
  const sorted = rankedTeams(teams);
  const textMuted = onDark ? "text-body-muted" : "text-ink-muted-48";
  const textMain = onDark ? "text-body-on-dark" : "text-ink";
  const rowBorder = onDark ? "border-white/10" : "border-divider-soft";

  return (
    <ul className="flex flex-col">
      {sorted.map((team) => {
        const isCurrent = team.id === currentTeamId;
        return (
          <li
            key={team.id}
            className={`flex items-center justify-between border-b ${rowBorder} py-sm last:border-b-0`}
          >
            <span className="flex items-center gap-xs">
              {isCurrent && (
                <span
                  aria-label="Current turn"
                  className="inline-block h-[8px] w-[8px] rounded-full bg-primary"
                />
              )}
              <span
                className={`text-body-apple transition-colors duration-base ease-soft ${
                  isCurrent ? "font-semibold text-primary" : textMain
                }`}
              >
                {team.name}
              </span>
            </span>
            <span className={`text-body-strong font-semibold ${textMain}`}>
              {team.score}
              <span className={`ml-xxs text-caption font-normal ${textMuted}`}>
                pts
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
