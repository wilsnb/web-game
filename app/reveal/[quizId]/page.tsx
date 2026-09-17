import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizById } from "@/lib/quizzes";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type PageProps = {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ found?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = getQuizById(quizId);
  return {
    title: quiz ? `${quiz.title} — Answers` : "Answers",
    robots: { index: false },
  };
}

/**
 * Answer reveal for a quiz — the "top 20" list. This is the page the results
 * screen sends logged-out users to after they log in (via ?next=), carrying
 * which ranks they found in ?found=1,3,7 so those stay highlighted.
 */
export default async function RevealPage({ params, searchParams }: PageProps) {
  const { quizId } = await params;
  const { found } = await searchParams;
  const quiz = getQuizById(quizId);
  if (!quiz) notFound();

  const foundRanks = new Set(
    (found ?? "")
      .split(",")
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n))
  );

  const top = quiz.list
    .filter((e) => e.rank <= 20)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
          Answers
        </p>
        <h1 className="mt-xs font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          {quiz.title}
        </h1>
        <p className="mt-sm font-haas text-at-body-md text-at-body">
          The real top {top.length}. Answers your group found are highlighted.
        </p>

        <ol className="mt-lg overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas shadow-at-card">
          {top.map((entry) => {
            const wasFound = foundRanks.has(entry.rank);
            return (
              <li
                key={entry.rank}
                className="flex items-center gap-md border-b border-at-hairline px-md py-sm last:border-b-0"
              >
                <span className="w-[32px] flex-none text-center font-haas text-at-body-md tabular-nums text-at-muted">
                  #{entry.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-haas text-at-body-md font-medium text-at-ink">
                  {entry.answer}
                </span>
                <span
                  className={`flex-none rounded-at-xs px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide ${
                    wasFound
                      ? "bg-at-mint text-at-ink"
                      : "bg-at-surface-strong text-at-muted"
                  }`}
                >
                  {wasFound ? "Found" : "Missed"}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-lg flex flex-wrap gap-sm">
          <Link
            href={`/play/${quiz.id}`}
            className="inline-flex items-center justify-center rounded-at-lg bg-at-primary px-lg py-md font-haas text-at-button font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
          >
            Play again
          </Link>
          <Link
            href="/#games"
            className="inline-flex items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg py-md font-haas text-at-button font-medium text-at-ink no-underline transition-all hover:border-at-border-strong hover:shadow-at-card"
          >
            More games
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
