import Link from "next/link";

/**
 * Game routes keep the original Apple-styled thin black global nav.
 * (The homepage renders its own Airtable-styled Navbar instead.)
 */
export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 h-[44px] w-full bg-surface-black text-body-on-dark">
        <nav
          aria-label="Global"
          className="mx-auto flex h-full max-w-grid items-center justify-between px-lg"
        >
          <Link
            href="/"
            className="focus-ring text-nav-link font-normal tracking-tight text-body-on-dark hover:text-white"
          >
            Qwardoo
          </Link>
          <span className="text-nav-link text-body-muted">
            Pass &amp; Play Party Quiz
          </span>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
