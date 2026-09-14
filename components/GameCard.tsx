import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CatalogGame } from "@/data/catalog";

/**
 * Game card in the Airtable editorial grammar.
 *  - Bordered card surface distinct from the page background.
 *  - `comingSoon` games are dimmed, grayscaled, and non-interactive.
 *  - Games with an `href` become links with a hover lift.
 *  - Games without an href (built but not yet wired) render as static cards.
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
  const isLink = !soon && Boolean(game.href);

  const inner = (
    <>
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
            soon ? "text-at-muted" : isLink ? "text-at-link" : "text-at-ink"
          }`}
        >
          {game.title}
        </h3>
        <p className="mt-[4px] line-clamp-2 font-haas text-at-body-md text-at-body">
          {game.description}
        </p>
      </div>
    </>
  );

  const baseClass =
    "flex h-full items-stretch gap-md rounded-at-md border border-at-hairline bg-at-surface-soft p-md shadow-at-card";

  if (isLink) {
    return (
      <Link
        href={game.href!}
        className={`${baseClass} no-underline transition-all duration-150 hover:-translate-y-[2px] hover:border-at-border-strong hover:shadow-at-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div aria-disabled={soon} className={`${baseClass} ${soon ? "opacity-70" : ""}`}>
      {inner as ReactNode}
    </div>
  );
}
