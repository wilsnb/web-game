import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountTabs } from "@/components/AccountTabs";
import { getPlayerStats, tierForPoints, BADGE_TIERS } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Your stats",
  description: "Your Qwardoo badge level and gameplay stats.",
  alternates: { canonical: "/account/stats" },
};

export default async function StatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/stats");

  const stats = await getPlayerStats();
  const { current, next, pointsToNext } = tierForPoints(stats.totalPoints);
  const hasPlayed = stats.gamesPlayed > 0;

  // Progress toward next tier (0–100).
  const progress =
    next && pointsToNext !== null
      ? Math.max(
          0,
          Math.min(
            100,
            ((stats.totalPoints - current.minPoints) /
              (next.minPoints - current.minPoints)) *
              100
          )
        )
      : 100;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <h1 className="font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          Your stats
        </h1>

        <AccountTabs active="stats" />

        {/* Badge tier + progress */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <div className="flex items-center gap-sm">
            <span
              className={`rounded-at-sm ${current.color} px-md py-[6px] font-haas text-at-body-md font-medium text-at-ink`}
            >
              {current.name}
            </span>
            <span className="font-haas text-at-body-md text-at-muted">
              {stats.totalPoints.toLocaleString()} points
            </span>
          </div>

          {next && pointsToNext !== null ? (
            <div className="mt-md">
              <div className="h-[8px] w-full overflow-hidden rounded-pill bg-at-surface-strong">
                <div
                  className="h-full rounded-pill bg-at-ink transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-xs font-haas text-at-caption text-at-muted">
                {pointsToNext.toLocaleString()} points to {next.name}
              </p>
            </div>
          ) : (
            <p className="mt-md font-haas text-at-caption text-at-muted">
              You&apos;ve reached the top tier. 🏆
            </p>
          )}
        </div>

        {/* Summary numbers */}
        <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3">
          {[
            { value: stats.gamesPlayed.toLocaleString(), label: "Games played" },
            {
              value: stats.totalPoints.toLocaleString(),
              label: "Total points",
            },
            {
              value: stats.perQuiz.length.toLocaleString(),
              label: "Quizzes tried",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-at-md border border-at-hairline bg-at-canvas p-md text-center shadow-at-card"
            >
              <div className="font-haas text-at-display-md font-normal text-at-ink">
                {s.value}
              </div>
              <div className="mt-xxs font-haas text-at-caption text-at-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Per-quiz breakdown */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Per-quiz breakdown
          </h2>
          {hasPlayed && stats.perQuiz.length > 0 ? (
            <ul className="mt-md flex flex-col gap-xs">
              {stats.perQuiz.map((q) => (
                <li
                  key={q.quizId}
                  className="flex items-center justify-between border-b border-at-hairline py-xs font-haas text-at-body-md text-at-ink last:border-b-0"
                >
                  <span>{q.quizTitle}</span>
                  <span className="text-at-muted">
                    {q.timesPlayed}× · best {q.bestScore}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-md rounded-at-md border border-dashed border-at-hairline p-md font-haas text-at-body-md text-at-muted">
              No games played yet. Your scores, best results, and per-quiz
              history will appear here once you start playing.{" "}
              <Link
                href="/#games"
                className="text-at-link hover:text-at-link-active"
              >
                Find a game →
              </Link>
            </p>
          )}
        </div>

        {/* Badge ladder */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Badge levels
          </h2>
          <div className="mt-md flex flex-wrap gap-xs">
            {BADGE_TIERS.map((tier) => (
              <span
                key={tier.name}
                className={`rounded-at-xs ${tier.color} px-[8px] py-[3px] font-haas text-at-caption text-at-ink ${
                  tier.name === current.name ? "" : "opacity-60"
                }`}
              >
                {tier.name} · {tier.minPoints.toLocaleString()}+
              </span>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
