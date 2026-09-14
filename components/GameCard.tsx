import Image from "next/image";
import type { CatalogGame } from "@/data/catalog";

/**
 * Placeholder game card in the Airtable editorial grammar.
 *  - Bordered card surface distinct from the page background.
 *  - `comingSoon` games are dimmed and carry a "Coming soon" badge.
 *  - No game logic is wired yet, so cards are non-interactive on purpose.
 *
 * `thumbnail` is the category thumbnail, shared by its games for now.
 */
export function GameCard({
  game,
  thumbnail,
}: {
  game: CatalogGame;
  thumbnail: string;
}) {
  const soon = game.comingSoon;

  return (
    <div
      aria-disabled={soon}
      className={`flex items-stretch gap-md rounded-at-md border bg-at-surface-soft p-md shadow-at-card ${
        soon ? "border-at-hairline opacity-70" : "border-at-hairline"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-[84px] w-[120px] flex-none overflow-hidden rounded-at-sm border border-at-hairline bg-at-canvas">
        <Image
          src={thumbnail}
          alt=""
          fill
          sizes="120px"
          className={`object-cover ${soon ? "grayscale" : ""}`}
        />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-col justify-center">
        <div className="flex items-center gap-xs">
          {soon ? (
            <span className="rounded-at-xs bg-at-surface-strong px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-muted">
              Coming soon
            </span>
          ) : (
            <span className="rounded-at-xs bg-at-cream px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-ink">
              New
            </span>
          )}
        </div>
        <h3
          className={`mt-[6px] font-haas text-at-title-sm font-medium ${
            soon ? "text-at-muted" : "text-at-ink"
          }`}
        >
          {game.title}
        </h3>
        <p className="mt-[4px] line-clamp-2 font-haas text-at-body-md text-at-body">
          {game.description}
        </p>
      </div>
    </div>
  );
}
