import Link from "next/link";

/**
 * Shared site footer with legal links. Airtable footer grammar:
 * light canvas surface, muted text, quiet links.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-at-hairline bg-at-canvas">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-sm px-md py-lg sm:flex-row sm:items-center sm:justify-between sm:px-lg">
        <p className="font-haas text-at-body-md text-at-muted">
          Qwardoo is a local pass-and-play party game. No accounts required to
          play.
        </p>
        <nav
          aria-label="Legal"
          className="flex items-center gap-md font-haas text-at-body-md"
        >
          <Link href="/" className="text-at-link hover:text-at-link-active">
            Home
          </Link>
          <Link
            href="/privacy"
            className="text-at-link hover:text-at-link-active"
          >
            Privacy
          </Link>
          <Link href="/terms" className="text-at-link hover:text-at-link-active">
            Terms
          </Link>
          <span className="text-at-muted">© {year}</span>
        </nav>
      </div>
    </footer>
  );
}
