import type { Metadata } from "next";
import { getAllQuizIds, getAllQuizSummaries } from "@/lib/quizzes";
import { groupByCategory } from "@/lib/categories";
import { getNavUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { CategorySections } from "@/components/CategorySections";
import { Sidebar } from "@/components/Sidebar";
import { CurrentDate } from "@/components/CurrentDate";

export const metadata: Metadata = {
  title: "Ranked — The Pass-and-Play Party Quiz",
  description:
    "Pick a ranked list and take turns guessing. The closer your correct guess is to #1, the more points you score. 1–7 players or teams, one shared device.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const quizzes = getAllQuizSummaries();
  const quizIds = getAllQuizIds();
  const groups = groupByCategory(quizzes);
  const user = await getNavUser();

  return (
    <div className="min-h-screen bg-at-surface-soft">
      <Navbar categories={groups} quizIds={quizIds} user={user} />

      {/* Hero / welcome band — calm white canvas, Airtable editorial */}
      <section className="bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
            Pass &amp; play party quiz
          </p>
          <h1 className="mt-xs max-w-[720px] font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
            Welcome to Ranked
          </h1>
          <p className="mt-sm max-w-[640px] font-haas text-at-title-md font-normal text-at-body">
            Pick a ranked list and take turns guessing. The closer your correct
            guess lands to #1, the more points it scores.
          </p>
          <div className="mt-md">
            <CurrentDate />
          </div>
        </div>
      </section>

      {/* Two-column main area */}
      <section className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
        <div className="grid grid-cols-1 gap-xl lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: quizzes grouped by category (anchored for the nav dropdown) */}
          <div>
            <div className="mb-lg flex items-baseline justify-between">
              <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
                Browse by category
              </h2>
              <span className="font-haas text-at-body-md text-at-muted">
                {groups.length} categories · {quizzes.length} quizzes
              </span>
            </div>
            <CategorySections groups={groups} />
          </div>

          {/* Right: recommended sidebar (stacks below on mobile/tablet) */}
          <div className="lg:sticky lg:top-[88px] lg:self-start">
            <Sidebar quizzes={quizzes} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-at-hairline bg-at-canvas">
        <div className="mx-auto max-w-[1280px] px-md py-lg sm:px-lg">
          <p className="font-haas text-at-body-md text-at-muted">
            Ranked is a local pass-and-play party game. All quiz data is bundled
            and cited per list. No accounts, no tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}
