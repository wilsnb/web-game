import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountTabs } from "@/components/AccountTabs";
import { ProfileVisibilityToggle } from "@/components/ProfileVisibilityToggle";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { getProfile } from "@/lib/profile";
import { formatIdr, PLAN } from "@/lib/subscription/plan";
import {
  getSubscription,
  isSubscriptionActive,
} from "@/lib/subscription/subscription";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your Qwardoo account and membership.",
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  // Existing users without a username must pick one first.
  const profile = await getProfile();
  if (!profile?.username) redirect("/onboarding?next=/account");

  const meta = user.user_metadata ?? {};
  const name = profile.username;
  const avatarUrl =
    (meta.avatar_url as string) || (meta.picture as string) || null;
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const sub = await getSubscription();
  const proActive = isSubscriptionActive(sub);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <h1 className="font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          Your account
        </h1>

        <AccountTabs active="account" />

        {/* Profile */}
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
              <div className="flex items-center gap-xs">
                <span className="font-haas text-at-title-md font-medium text-at-ink">
                  {name}
                </span>
                {proActive && (
                  <span className="rounded-at-xs bg-at-coral px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-on-dark">
                    Pro
                  </span>
                )}
              </div>
              <div className="font-haas text-at-body-md text-at-muted">
                {user.email}
              </div>
            </div>
          </div>

          <dl className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <dt className="font-haas text-at-caption text-at-muted">
                Username
              </dt>
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
                Signed in with
              </dt>
              <dd className="font-haas text-at-body-md text-at-ink">Google</dd>
            </div>
          </dl>
        </div>

        {/* Membership */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Membership
          </h2>
          {proActive ? (
            <div className="mt-sm">
              <p className="font-haas text-at-body-md text-at-ink">
                <span className="font-medium">Qwardoo Pro</span> — active
              </p>
              {sub?.currentPeriodEnd && (
                <p className="mt-xxs font-haas text-at-caption text-at-muted">
                  Renews / expires on{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-sm">
              <p className="font-haas text-at-body-md text-at-ink">
                You&apos;re on the free plan. Every game is free to play.
              </p>
              <Link
                href="/subscribe"
                className="mt-sm inline-flex items-center justify-center rounded-at-lg bg-at-primary px-lg py-md font-haas text-at-button font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
              >
                Go Premium · {formatIdr(PLAN.priceIdr)}/mo
              </Link>
            </div>
          )}
        </div>

        {/* Profile visibility */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Profile visibility
          </h2>
          <p className="mt-sm font-haas text-at-body-md text-at-muted">
            When your profile is public, your username can appear on
            leaderboards. Turn this off to stay off the leaderboards.
          </p>
          <div className="mt-md">
            <ProfileVisibilityToggle initialPublic={profile.isPublic} />
          </div>
        </div>

        {/* Preferences (placeholder — not yet persisted) */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Preferences
          </h2>
          <p className="mt-sm font-haas text-at-body-md text-at-muted">
            Game preferences (default players, timer, sound) will live here soon.
          </p>
        </div>

        {/* Data & privacy */}
        <div className="mt-lg rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card">
          <h2 className="font-haas text-at-title-lg font-normal text-at-ink">
            Data &amp; privacy
          </h2>
          <p className="mt-sm font-haas text-at-body-md text-at-muted">
            Read how we handle your data in our{" "}
            <Link
              href="/privacy"
              className="text-at-link hover:text-at-link-active"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Danger zone — permanent account deletion (kept last, in red) */}
        <DeleteAccountSection />
      </section>

      <SiteFooter />
    </div>
  );
}
