import Link from "next/link";

/**
 * Shared site footer. Airtable footer grammar: light canvas surface, muted
 * text, quiet links. Columns stack on mobile.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  const columns: {
    heading: string;
    links: { label: string; href: string }[];
  }[] = [
    {
      heading: "Play",
      links: [
        { label: "Home", href: "/" },
        { label: "All games", href: "/category" },
        { label: "Leaderboard", href: "/leaderboard" },
      ],
    },
    {
      heading: "Get in touch",
      links: [
        { label: "Contact us", href: "/contact?type=contact" },
        { label: "Give feedback", href: "/contact?type=feedback" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-at-hairline bg-at-canvas">
      <div className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand / tagline */}
          <div>
            <p className="font-haas text-at-title-sm font-medium text-at-ink">
              Qwardoo
            </p>
            <p className="mt-xs max-w-[280px] font-haas text-at-body-md text-at-muted">
              A pass-and-play party game. No accounts required to play.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="mb-xs font-haas text-at-caption font-medium uppercase tracking-wide text-at-muted">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-xs">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-haas text-at-body-md text-at-link no-underline hover:text-at-link-active"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-lg border-t border-at-hairline pt-md">
          <p className="font-haas text-at-caption text-at-muted">
            © {year} Qwardoo
          </p>
        </div>
      </div>
    </footer>
  );
}
