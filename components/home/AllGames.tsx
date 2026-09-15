import Link from "next/link";
import { getAllGames } from "@/data/catalog";
import { GameCard } from "@/components/GameCard";

/**
 * Single "All games & activities" grid — every game, 3 per row (compact tiles),
 * with one "Browse all games" button. Replaces the per-category home sections.
 */
export function AllGames() {
  const games = getAllGames();

  return (
    <section id="games" className="scroll-mt-[72px]">
      <div className="mx-auto max-w-[1280px] px-md py-section sm:px-lg">
        <div className="mb-lg">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
            All games &amp; activities
          </p>
          <h2 className="mt-xxs font-haas text-at-display-md font-normal text-at-ink">
            Pick a game and play
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <li key={game.id}>
              <GameCard game={game} thumbnail={game.thumbnail} layout="tile" />
            </li>
          ))}
        </ul>

        <div className="mt-xl flex justify-center">
          <Link
            href="/category"
            className="inline-flex items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg py-md font-haas text-at-button font-medium text-at-ink no-underline transition-all hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
          >
            Browse all games
          </Link>
        </div>
      </div>
    </section>
  );
}
