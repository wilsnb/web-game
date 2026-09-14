import type { Metadata } from "next";
import { getAllQuizIds } from "@/lib/quizzes";
import { getHomeCategories, getTotalGameCount } from "@/data/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { DemoSection } from "@/components/home/DemoSection";
import { Faq } from "@/components/home/Faq";

export const metadata: Metadata = {
  title: "Ranked — Quizzes, Party Games & Quick Activities",
  description:
    "One hub for trivia rankings, party games, couples games and brain teasers. Pass-and-play on one shared device — no downloads, no account needed.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const quizIds = getAllQuizIds();
  const homeCategories = getHomeCategories();
  const totalGames = getTotalGameCount();

  // Flagship play target: the first real playable ranked quiz, if any exist.
  const flagshipHref = quizIds.length > 0 ? `/play/${quizIds[0]}` : null;

  return (
    <div className="min-h-screen bg-at-surface-soft">
      <SiteHeader />

      {/* 1. Hero */}
      <Hero quizIds={quizIds} />

      {/* 2. Stats bar */}
      <StatsBar gameCount={totalGames} />

      {/* 3. Category-grouped game sections */}
      <section
        id="categories"
        className="scroll-mt-[72px] bg-at-surface-soft"
      >
        <div className="mx-auto max-w-[1280px] px-md py-section sm:px-lg">
          <div className="mb-xl">
            <h2 className="font-haas text-at-display-md font-normal text-at-ink">
              Browse by category
            </h2>
            <p className="mt-xs max-w-[640px] font-haas text-at-title-md font-normal text-at-body">
              Pick a category and jump into a game. More categories are on the
              way.
            </p>
          </div>

          <div className="flex flex-col gap-section">
            {homeCategories.map((category) => (
              <CategoryShowcase key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. See it in action */}
      <DemoSection playHref={flagshipHref} />

      {/* 5. FAQ */}
      <Faq />

      {/* 6. Footer */}
      <SiteFooter />
    </div>
  );
}
