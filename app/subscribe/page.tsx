import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SubscribeButton } from "@/components/SubscribeButton";
import { PLAN, formatIdr } from "@/lib/subscription/plan";
import {
  getSubscription,
  isSubscriptionActive,
} from "@/lib/subscription/subscription";

export const metadata: Metadata = {
  title: "Qwardoo Pro",
  description: "Subscribe to Qwardoo Pro.",
  alternates: { canonical: "/subscribe" },
};

const PERKS = [
  "Support the game and unlock Pro",
  "Access to Pro-only games as they launch",
  "A Pro badge on your profile",
];

export default async function SubscribePage() {
  const sub = await getSubscription();
  const active = isSubscriptionActive(sub);
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-content px-md py-section sm:px-lg">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
          Membership
        </p>
        <h1 className="mt-xs font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          {PLAN.name}
        </h1>

        <div className="mt-lg rounded-at-lg border border-at-hairline bg-at-canvas p-lg shadow-at-card sm:p-xl">
          <div className="flex items-baseline gap-xs">
            <span className="font-haas text-at-display-md font-normal text-at-ink">
              {formatIdr(PLAN.priceIdr)}
            </span>
            <span className="font-haas text-at-body-md text-at-muted">
              / month
            </span>
          </div>

          <ul className="mt-lg flex flex-col gap-sm">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-xs font-haas text-at-body-md text-at-body"
              >
                <span aria-hidden className="text-at-success">
                  ✓
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-xl">
            {active ? (
              <div className="rounded-at-md border border-at-hairline bg-at-surface-soft p-md">
                <p className="font-haas text-at-body-md font-medium text-at-ink">
                  You&apos;re subscribed to {PLAN.name}. 🎉
                </p>
                {sub?.currentPeriodEnd && (
                  <p className="mt-xxs font-haas text-at-caption text-at-muted">
                    Active until{" "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <>
                <SubscribeButton
                  label={`Subscribe · ${formatIdr(PLAN.priceIdr)}/mo`}
                  isProduction={isProduction}
                />
                <p className="mt-sm font-haas text-at-caption text-at-muted">
                  You&apos;ll be asked to sign in if you haven&apos;t already.
                  Pay with QRIS, GoPay, card and more via Midtrans.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="mt-lg font-haas text-at-body-md text-at-muted">
          Every game stays free to play.{" "}
          <Link href="/" className="text-at-link hover:text-at-link-active">
            Back home
          </Link>
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
