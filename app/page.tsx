import type { Metadata } from "next";
import { getAllQuizIds } from "@/lib/quizzes";
import { CATALOG, getCatalogCategories } from "@/data/catalog";
import { getNavUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { CatalogSections } from "@/components/CatalogSections";
import { CurrentDate } from "@/components/CurrentDate";

export const metadata: Metadata = {
  title: "Ranked — Party Games & Trivia",
  description:
    "Trivia, party games, couples games, brain teasers and more. Pass-and-play on one shared device.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const quizIds = getAllQuizIds();
  const categories = getCatalogCategories();
  const totalGames = CATALOG.reduce((n, c) => n + c.games.length, 0);
  const user = await getNavUser();

  return (
    <div className="min-h-screen bg-at-surface-soft">
      <Navbar categories={categories} quizIds={quizIds} user={user} />

      {/* Hero / welcome band — calm white canvas, Airtable editorial */}
      <section className="bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
            Party games &amp; trivia
          </p>
          <h1 className="mt-xs max-w-[720px] font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
            Welcome to Ranked
          </h1>
          <p className="mt-sm max-w-[640px] font-haas text-at-title-md font-normal text-at-body">
            Trivia, party games, couples games, brain teasers and more — all
            pass-and-play on one shared device. New games are on the way.
          </p>
          <div className="mt-md">
            <CurrentDate />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
        <div className="mb-lg flex items-baseline justify-between">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Browse by category
          </h2>
          <span className="font-haas text-at-body-md text-at-muted">
            {categories.length} categories · {totalGames} games
          </span>
        </div>
        <CatalogSections categories={CATALOG} />
      </section>

      {/* Footer */}
      <footer className="border-t border-at-hairline bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-lg sm:px-lg">
          <p className="font-haas text-at-body-md text-at-muted">
            Ranked is a local pass-and-play party game. Games marked
            &ldquo;Coming soon&rdquo; are still in the works. No accounts
            required to play.
          </p>
        </div>
      </footer>
    </div>
  );
}
