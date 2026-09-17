import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLeaderboard } from "@/lib/leaderboard";
import { getAllQuizSummaries } from "@/lib/quizzes";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top scores across Qwardoo quizzes.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ quiz?: string }>;
}) {
  const { quiz } = await searchParams;
  const quizzes = getAllQuizSummaries();
  const activeQuiz = quiz && quizzes.some((q) => q.id === quiz) ? quiz : undefined;

  const rows = await getLeaderboard(activeQuiz, 20);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
          Leaderboard
        </p>
        <h1 className="mt-xs font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          Top scores
        </h1>
        <p className="mt-sm font-haas text-at-body-md text-at-body">
          The best game scores from players with a public profile.
        </p>

        {/* Quiz filter */}
        <div className="mt-lg flex flex-wrap gap-xs">
          <Link
            href="/leaderboard"
            className={`rounded-pill border px-md py-[6px] font-haas text-at-caption no-underline transition-colors ${
              !activeQuiz
                ? "border-at-ink bg-at-ink text-at-on-dark"
                : "border-at-hairline text-at-ink hover:border-at-border-strong"
            }`}
          >
            All quizzes
          </Link>
          {quizzes.map((q) => (
            <Link
              key={q.id}
              href={`/leaderboard?quiz=${q.id}`}
              className={`rounded-pill border px-md py-[6px] font-haas text-at-caption no-underline transition-colors ${
                activeQuiz === q.id
                  ? "border-at-ink bg-at-ink text-at-on-dark"
                  : "border-at-hairline text-at-ink hover:border-at-border-strong"
              }`}
            >
              {q.title}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="mt-lg overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas shadow-at-card">
          {rows.length === 0 ? (
            <p className="p-lg font-haas text-at-body-md text-at-muted">
              No scores yet{activeQuiz ? " for this quiz" : ""}. Play a game
              (signed in, public profile) to get on the board.{" "}
              <Link
                href="/#games"
                className="text-at-link hover:text-at-link-active"
              >
                Find a game →
              </Link>
            </p>
          ) : (
            <ul>
              {rows.map((row, i) => (
                <li
                  key={`${row.username}-${row.quizId}-${i}`}
                  className="flex items-center gap-md border-b border-at-hairline px-md py-sm last:border-b-0"
                >
                  <span className="w-[28px] flex-none text-center font-haas text-at-title-sm font-medium text-at-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-haas text-at-body-md font-medium text-at-ink">
                    {row.username}
                  </span>
                  {!activeQuiz && (
                    <span className="hidden min-w-0 flex-1 truncate font-haas text-at-caption text-at-muted sm:block">
                      {row.quizTitle}
                    </span>
                  )}
                  <span className="flex-none font-haas text-at-title-sm font-medium tabular-nums text-at-ink">
                    {row.topScore.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
