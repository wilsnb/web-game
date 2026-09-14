import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, getTotalGameCount, urlSlug } from "@/data/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { GameCard } from "@/components/GameCard";

export const metadata: Metadata = {
  title: "All games",
  description:
    "Browse every game on Ranked — trivia, party games, couples games, brain teasers, icebreakers and more.",
  alternates: { canonical: "/category" },
};

export default function AllGamesPage() {
  const total = getTotalGameCount();

  return (
    <div className="min-h-screen bg-at-surface-soft">
      <SiteHeader />

      {/* Header band */}
      <section className="bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
            All games
          </p>
          <h1 className="mt-xs font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
            Every game on Ranked
          </h1>
          <p className="mt-sm max-w-[640px] font-haas text-at-title-md font-normal text-at-body">
            {CATALOG.length} categories · {total} games. Games marked
            &ldquo;Coming soon&rdquo; are still in the works.
          </p>
        </div>
      </section>

      {/* Every category, each with its games */}
      <section className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
        <div className="flex flex-col gap-xl">
          {CATALOG.map((cat) => (
            <div key={cat.slug}>
              <div className="mb-xs flex items-baseline justify-between">
                <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
                  <Link
                    href={`/category/${urlSlug(cat)}`}
                    className="text-at-ink no-underline hover:text-at-link"
                  >
                    {cat.label}
                  </Link>
                </h2>
                <Link
                  href={`/category/${urlSlug(cat)}`}
                  className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
                >
                  View category →
                </Link>
              </div>
              <p className="mb-md font-haas text-at-body-md text-at-muted">
                {cat.description}
              </p>
              <ul className="flex flex-col gap-md">
                {cat.games.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game} thumbnail={cat.thumbnail} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-at-hairline bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-lg sm:px-lg">
          <Link
            href="/"
            className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
          >
            ← Back home
          </Link>
        </div>
      </footer>
    </div>
  );
}
