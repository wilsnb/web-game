import Image from "next/image";
import Link from "next/link";
import type { CatalogGame } from "@/data/catalog";

/**
 * Game card in the Airtable editorial grammar.
 *  - Bordered card surface distinct from the page background.
 *  - `comingSoon` games are dimmed, grayscaled, and non-interactive.
 *  - Games with an `href` become links with a hover lift.
 *
 * Layouts:
 *  - "row" (default): horizontal — side thumbnail + text. Used in lists.
 *  - "tile": compact vertical card for the 3-up homepage grid.
 */
export function GameCard({
  game,
  thumbnail,
  layout = "row",
}: {
  game: CatalogGame;
  thumbnail: string;
  layout?: "row" | "tile";
}) {
  const soon = game.comingSoon;
  const isLink = !soon && Boolean(game.href);

  const badge = soon ? (
    <span className="rounded-at-xs bg-at-surface-strong px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-muted">
      Coming soon
    </span>
  ) : (
    <span className="rounded-at-xs bg-at-cream px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-ink">
      New
    </span>
  );

  const titleClass = `font-haas text-at-title-sm font-medium ${
    soon ? "text-at-muted" : isLink ? "text-at-link" : "text-at-ink"
  }`;

  // Every card reacts on hover so the grid feels alive: a gentle scale-up +
  // glow. Playable (link) cards react a touch more strongly; coming-soon cards
  // lift subtly to acknowledge the hover without implying they're clickable.
  const baseClass =
    "rounded-at-md border border-at-hairline bg-at-surface-soft shadow-at-card transition-all duration-200 ease-out will-change-transform";
  const linkClass =
    "no-underline hover:-translate-y-[4px] hover:scale-[1.03] hover:border-at-border-strong hover:shadow-at-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link";
  const staticHoverClass = soon
    ? "opacity-70 hover:opacity-100 hover:-translate-y-[2px] hover:shadow-at-card-hover"
    : "hover:-translate-y-[3px] hover:scale-[1.02] hover:border-at-border-strong hover:shadow-at-glow";

  let inner: React.ReactNode;

  if (layout === "tile") {
    // Compact vertical card (like the reference grid).
    inner = (
      <div className="flex h-full flex-col gap-xs p-md">
        <div className="flex items-center gap-xs">
          <span className="relative h-[28px] w-[28px] flex-none overflow-hidden rounded-at-sm border border-at-hairline bg-at-canvas">
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="28px"
              className={`object-cover ${soon ? "grayscale" : ""}`}
            />
          </span>
          {badge}
        </div>
        <h3 className={`mt-xxs ${titleClass}`}>{game.title}</h3>
        <p className="line-clamp-3 font-haas text-at-body-md text-at-body">
          {game.description}
        </p>
      </div>
    );
  } else {
    // Horizontal row card.
    inner = (
      <div className="flex h-full items-stretch gap-md p-md">
        <div className="relative h-[84px] w-[120px] flex-none overflow-hidden rounded-at-sm border border-at-hairline bg-at-canvas">
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="120px"
            className={`object-cover ${soon ? "grayscale" : ""}`}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          {badge}
          <h3 className={`mt-[6px] ${titleClass}`}>{game.title}</h3>
          <p className="mt-[4px] line-clamp-2 font-haas text-at-body-md text-at-body">
            {game.description}
          </p>
        </div>
      </div>
    );
  }

  if (isLink) {
    return (
      <Link href={game.href!} className={`block h-full ${baseClass} ${linkClass}`}>
        {inner}
      </Link>
    );
  }

  return (
    <div
      aria-disabled={soon}
      className={`h-full ${baseClass} ${staticHoverClass}`}
    >
      {inner}
    </div>
  );
}
