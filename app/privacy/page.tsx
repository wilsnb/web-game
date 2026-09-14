import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ranked handles your data: Google sign-in profile info and saved gameplay progress.",
  alternates: { canonical: "/privacy" },
};

// TODO: replace the bracketed placeholders before publishing.
const CONTACT_EMAIL = "[your-contact-email@example.com]";
const EFFECTIVE_DATE = "[effective date]";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <p className="font-haas text-at-body-md leading-relaxed text-at-body">
        This Privacy Policy explains what information Ranked (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, why, and what choices you have. Ranked is a
        free, pass-and-play party quiz game. You can play as a guest without
        giving us any personal information. Some information is only collected
        if you choose to sign in.
      </p>

      <LegalSection heading="Information we collect">
        <p>We collect only what we need to run the game:</p>
        <ul className="ml-lg list-disc space-y-xxs">
          <li>
            <strong>Google account information (only if you sign in).</strong>{" "}
            When you choose &ldquo;Continue with Google,&rdquo; our
            authentication provider (Supabase) receives basic profile
            information from Google: your name, email address, and profile
            picture (avatar) URL.
          </li>
          <li>
            <strong>Gameplay progress and scores (only if you sign in).</strong>{" "}
            When you play while signed in, we store your game results — such as
            which quiz you played, your score, and the date — linked to your
            account so you can see your history.
          </li>
          <li>
            <strong>Session cookies.</strong> To keep you signed in, Supabase
            sets authentication cookies in your browser. These are essential for
            login to work.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <ul className="ml-lg list-disc space-y-xxs">
          <li>To sign you in and keep you signed in.</li>
          <li>
            To save and show your gameplay progress and scores when you&apos;re
            signed in.
          </li>
        </ul>
        <p>
          We do not use your information for advertising, and we do not build
          marketing profiles about you.
        </p>
      </LegalSection>

      <LegalSection heading="What we do NOT do">
        <ul className="ml-lg list-disc space-y-xxs">
          <li>We do not sell or rent your personal information.</li>
          <li>We do not show ads or use advertising trackers.</li>
          <li>We do not use analytics or third-party tracking cookies.</li>
          <li>We do not send marketing emails.</li>
          <li>
            If you play as a guest (without signing in), we do not store your
            gameplay data — the game runs locally on your device.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Service providers we rely on">
        <p>
          We use a small number of third-party services to run Ranked. Your
          information is handled under their respective privacy policies:
        </p>
        <ul className="ml-lg list-disc space-y-xxs">
          <li>
            <strong>Google</strong> — sign-in (OAuth) provider.
          </li>
          <li>
            <strong>Supabase</strong> — authentication and database that stores
            your account and saved gameplay data.
          </li>
          <li>
            <strong>Vercel</strong> — hosting for the website.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We use only essential authentication/session cookies set by Supabase
          to keep you logged in. We do not use analytics or advertising cookies.
          If you don&apos;t sign in, these cookies aren&apos;t needed.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        <ul className="ml-lg list-disc space-y-xxs">
          <li>You can use the game as a guest, without an account.</li>
          <li>You can sign out at any time from the navigation bar.</li>
          <li>
            You can request access to, or deletion of, your account and saved
            gameplay data by emailing us at {CONTACT_EMAIL}.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Data retention">
        <p>
          We keep your account information and saved gameplay data for as long
          as your account exists. If you ask us to delete your account, we will
          remove your personal information and saved gameplay data, except where
          we&apos;re required to keep it.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          Ranked is a general-audience party game and is not directed at
          children under 13. We do not knowingly collect personal information
          from children under 13.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this Privacy Policy as the game grows. When we do,
          we&apos;ll update the effective date above. Significant changes will
          be reflected on this page.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions or requests about your privacy? Email us at {CONTACT_EMAIL}.
        </p>
        <p>
          See also our{" "}
          <Link
            href="/terms"
            className="text-at-link hover:text-at-link-active"
          >
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
