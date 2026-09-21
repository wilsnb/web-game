import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms for using Qwardoo, a free pass-and-play party quiz game with optional Google sign-in.",
  alternates: { canonical: "/terms" },
};

// NOTE: confirm this mailbox is set up before relying on it publicly.
const CONTACT_EMAIL = "support@qwardoo.com";
const EFFECTIVE_DATE = "September 11, 2026";
// TODO: set the country/state whose laws govern these terms (e.g. "Indonesia").
const JURISDICTION = "[your country / state]";

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" effectiveDate={EFFECTIVE_DATE}>
      <p className="font-haas text-at-body-md leading-relaxed text-at-body">
        These Terms &amp; Conditions govern your use of Qwardoo (the
        &ldquo;Service&rdquo;). By using the Service, you agree to these terms.
        If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <LegalSection heading="What Qwardoo is">
        <p>
          Qwardoo is a pass-and-play party quiz game you play on a shared
          device. The core game is free to play. We also offer an optional paid
          premium subscription with additional features; the free experience
          does not require any payment.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts and sign-in">
        <ul className="ml-lg list-disc space-y-xxs">
          <li>Signing in is optional — you can play as a guest.</li>
          <li>
            If you sign in, you do so with your Google account through our
            provider (Supabase). You are responsible for keeping access to your
            Google account secure.
          </li>
          <li>
            You must be old enough to use a Google account and to form a binding
            agreement in your location.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Saved gameplay data">
        <p>
          If you sign in, we store your gameplay progress and scores linked to
          your account so you can view your history. How we handle that data is
          described in our{" "}
          <Link
            href="/privacy"
            className="text-at-link hover:text-at-link-active"
          >
            Privacy Policy
          </Link>
          . You can request deletion of your account and saved data at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Payments and subscriptions">
        <ul className="ml-lg list-disc space-y-xxs">
          <li>
            Qwardoo offers an optional premium subscription. Buying it is
            entirely your choice — the core game remains free.
          </li>
          <li>
            Payments are processed by our payment provider, Midtrans. By
            subscribing, you also agree to Midtrans&apos;s applicable terms, and
            you confirm you&apos;re authorized to use the payment method you
            provide.
          </li>
          <li>
            Prices and what&apos;s included in premium may change over time. Any
            change applies going forward, not to a period you&apos;ve already
            paid for.
          </li>
          <li>
            You can stop using premium at any time. Unless stated otherwise at
            purchase, a subscription runs for the period you paid for and does
            not automatically grant a refund for the unused part of that period.
          </li>
          <li>
            For questions about billing, a charge, or a refund request, contact
            us at {CONTACT_EMAIL} and we&apos;ll do our best to help.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>When using the Service, you agree not to:</p>
        <ul className="ml-lg list-disc space-y-xxs">
          <li>
            Attempt to hack, disrupt, overload, or gain unauthorized access to
            the Service or its systems.
          </li>
          <li>Use the Service for any unlawful purpose.</li>
          <li>
            Attempt to access other users&apos; accounts or data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Quiz content and intellectual property">
        <p>
          Quiz lists are compiled from publicly available information, and each
          quiz cites its source. Facts and rankings belong to their respective
          sources. The website, its code, and its design are owned by the
          Service operator. You may play the game for personal, non-commercial
          enjoyment.
        </p>
      </LegalSection>

      <LegalSection heading="The Service is provided “as is”">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind. We don&apos;t
          guarantee the Service will always be available, error-free, or that
          quiz data is complete or perfectly accurate. This applies to both the
          free game and any premium features.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, the Service operator will not
          be liable for any indirect, incidental, or consequential damages
          arising from your use of the Service. To the greatest extent the law
          allows, our total liability is limited to the amount you paid us (if
          any) in the twelve months before the claim.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and availability">
        <p>
          We may update, change, or discontinue the Service or these terms at
          any time. If we change these terms, we&apos;ll update the effective
          date above. Continuing to use the Service after changes means you
          accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of {JURISDICTION}, without regard
          to conflict-of-law rules.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>Questions about these terms? Email us at {CONTACT_EMAIL}.</p>
      </LegalSection>
    </LegalPage>
  );
}
