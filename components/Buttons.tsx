import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Apple button grammars.
 *  - Primary: Action Blue pill (button-primary).
 *  - Secondary: ghost pill, blue text + 1px blue border (button-secondary-pill).
 * Press state: scale(0.95). Focus: 2px Focus Blue ring.
 */

const base =
  "press-scale focus-ring inline-flex items-center justify-center rounded-pill text-body-apple font-normal transition-all duration-base ease-soft will-change-transform hover:-translate-y-[1px] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-divider-soft disabled:text-ink-muted-48 disabled:shadow-none";

// Per-variant hover feedback. Primary lifts + darkens + gains a soft shadow;
// secondary fills with a faint tint. Both draw motion from `base`.
const primaryVariant =
  "bg-primary px-[22px] py-[11px] text-white hover:bg-primary-focus hover:shadow-at-card-hover";
const secondaryVariant =
  "border border-primary bg-transparent px-[22px] py-[11px] text-primary hover:bg-primary/[0.06] hover:shadow-at-card";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`${base} ${primaryVariant} ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`${base} ${secondaryVariant} ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${primaryVariant} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${secondaryVariant} ${className}`}
    >
      {children}
    </Link>
  );
}
