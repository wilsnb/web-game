import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPlayerStats, tierForPoints, BADGE_TIERS } from "@/lib/stats";
import { formatIdr, PLAN } from "@/lib/subscription/plan";
import {
  getSubscription,
  isSubscriptionActive,
} from "@/lib/subscription/subscription";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Qwardoo account, badge level, and gameplay stats.",
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "Player";
  const avatarUrl =
    (meta.avatar_url as string) || (meta.picture as string) || null;
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const stats = await getPlayerStats();
  const { current, next, pointsToNext } = tierForPoints(stats.totalPoints);
  const sub = await getSubscription();
  const proActive = isSubscriptionActive(sub);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <h1 className="font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          Your account
        </h1>

        {/* Account info */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <div className="flex items-center gap-md">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-[64px] w-[64px] rounded-full border border-at-hairline object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-at-cream font-haas text-at-title-lg font-medium text-at-ink"
              >
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <div className="font-haas text-at-title-md font-medium text-at-ink">
                {name}
              </div>
              <div className="font-haas text-at-body-md text-at-muted">
                {user.email}
              </div>
            </div>
          </div>

          <dl className="mt-lg grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <dt className="font-haas text-at-caption text-at-muted">Name</dt>
              <dd className="font-haas text-at-body-md text-at-ink">{name}</dd>
            </div>
            <div>
              <dt className="font-haas text-at-caption text-at-muted">Email</dt>
              <dd className="font-haas text-at-body-md text-at-ink">
                {user.email}
              </dd>
            </div>
            {joined && (
              <div>
                <dt className="font-haas text-at-caption text-at-muted">
                  Member since
                </dt>
                <dd className="font-haas text-at-body-md text-at-ink">
                  {joined}
                </dd>
              </div>
            )}
            <div>
              <dt className="font-haas text-at-caption text-at-muted">
                Membership
              </dt>
              <dd className="font-haas text-at-body-md text-at-ink">
                {proActive ? (
                  <>Qwardoo Pro (active)</>
                ) : (
                  <>
                    Free ·{" "}
                    <Link
                      href="/subscribe"
                      className="text-at-link hover:text-at-link-active"
                    >
                      Go Premium ({formatIdr(PLAN.priceIdr)}/mo)
                    </Link>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Stats */}
        <div
          id="stats"
          className="mt-lg scroll-mt-[88px] rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card"
        >
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Your stats
          </h2>

          {/* Badge tier */}
          <div className="mt-md flex items-center gap-sm">
            <span
              className={`rounded-at-sm ${current.color} px-md py-[6px] font-haas text-at-body-md font-medium text-at-ink`}
            >
              {current.name}
            </span>
            <span className="font-haas text-at-body-md text-at-muted">
              {stats.totalPoints.toLocaleString()} points
              {next && pointsToNext !== null && (
                <> · {pointsToNext.toLocaleString()} to {next.name}</>
              )}
            </span>
          </div>

          {/* Summary numbers */}
          <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3">
            <div>
              <div className="font-haas text-at-display-md font-normal text-at-ink">
                {stats.gamesPlayed}
              </div>
              <div className="font-haas text-at-caption text-at-muted">
                Games played
              </div>
            </div>
            <div>
              <div className="font-haas text-at-display-md font-normal text-at-ink">
                {stats.totalPoints.toLocaleString()}
              </div>
              <div className="font-haas text-at-caption text-at-muted">
                Total points
              </div>
            </div>
          </div>

          {/* Per-quiz stats */}
          <div className="mt-lg">
            {stats.perQuiz.length === 0 ? (
              <p className="rounded-at-md border border-dashed border-at-hairline p-md font-haas text-at-body-md text-at-muted">
                No games played yet. Your scores and per-quiz stats will show up
                here once you start playing.{" "}
                <Link
                  href="/#games"
                  className="text-at-link hover:text-at-link-active"
                >
                  Find a game →
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-xs">
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
            )}
          </div>

          {/* Tier ladder reference */}
          <div className="mt-lg">
            <p className="mb-xs font-haas text-at-caption uppercase tracking-wide text-at-muted">
              Badge levels
            </p>
            <div className="flex flex-wrap gap-xs">
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
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
