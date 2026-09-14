import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Apple button grammars.
 *  - Primary: Action Blue pill (button-primary).
 *  - Secondary: ghost pill, blue text + 1px blue border (button-secondary-pill).
 * Press state: scale(0.95). Focus: 2px Focus Blue ring.
 */

const base =
  "press-scale focus-ring inline-flex items-center justify-center rounded-pill text-body-apple font-normal disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-muted-48";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`${base} bg-primary px-[22px] py-[11px] text-on-primary text-white ${className}`}
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
      className={`${base} border border-primary bg-transparent px-[22px] py-[11px] text-primary ${className}`}
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
      className={`${base} bg-primary px-[22px] py-[11px] text-white ${className}`}
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
      className={`${base} border border-primary bg-transparent px-[22px] py-[11px] text-primary ${className}`}
    >
      {children}
    </Link>
  );
}
