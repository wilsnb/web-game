import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms for using Ranked, a free pass-and-play party quiz game with optional Google sign-in.",
  alternates: { canonical: "/terms" },
};

// TODO: replace the bracketed placeholders before publishing.
const CONTACT_EMAIL = "[your-contact-email@example.com]";
const EFFECTIVE_DATE = "[effective date]";
const JURISDICTION = "[your country / state]";

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" effectiveDate={EFFECTIVE_DATE}>
      <p className="font-haas text-at-body-md leading-relaxed text-at-body">
        These Terms &amp; Conditions govern your use of Ranked (the
        &ldquo;Service&rdquo;). By using the Service, you agree to these terms.
        If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <LegalSection heading="What Ranked is">
        <p>
          Ranked is a free, for-fun, pass-and-play party quiz game you play on a
          shared device. It is provided as a hobby/personal project, not a
          commercial product.
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
          The Service is provided free of charge, &ldquo;as is&rdquo; and
          &ldquo;as available,&rdquo; without warranties of any kind. We
          don&apos;t guarantee the Service will always be available,
          error-free, or that quiz data is complete or perfectly accurate.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, the Service operator will not
          be liable for any indirect, incidental, or consequential damages
          arising from your use of the Service. Because the Service is free, our
          total liability is limited to the greatest extent the law allows.
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
