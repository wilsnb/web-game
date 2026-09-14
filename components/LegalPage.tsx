import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Shared shell for legal/policy pages (Privacy, Terms).
 * Airtable editorial: white canvas, ~980px reading column, quiet type.
 */
export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-at-surface-soft">
      <SiteHeader />

      <section className="bg-at-canvas">
        <div className="mx-auto max-w-content px-md py-xl sm:px-lg">
          <h1 className="font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
            {title}
          </h1>
          <p className="mt-sm font-haas text-at-body-md text-at-muted">
            Effective date: {effectiveDate}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-content px-md py-xl sm:px-lg">
        <div className="legal-prose flex flex-col gap-lg">{children}</div>
      </section>

      <SiteFooter />
    </div>
  );
}

/** A titled section block used inside a LegalPage. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-xs font-haas text-at-title-lg font-normal text-at-ink">
        {heading}
      </h2>
      <div className="flex flex-col gap-sm font-haas text-at-body-md leading-relaxed text-at-body">
        {children}
      </div>
    </section>
  );
}
