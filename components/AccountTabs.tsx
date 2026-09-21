import Link from "next/link";

/** Tab-style nav shared by the Account and Stats pages. */
export function AccountTabs({ active }: { active: "account" | "stats" }) {
  const tabs = [
    { key: "account", label: "Account", href: "/account" },
    { key: "stats", label: "Stats", href: "/account/stats" },
  ] as const;

  return (
    <nav
      aria-label="Account sections"
      className="mt-lg flex gap-lg border-b border-at-hairline"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 pb-sm font-haas text-at-body-md no-underline transition-colors duration-base ease-soft ${
              isActive
                ? "border-at-ink font-medium text-at-ink"
                : "border-transparent text-at-muted hover:text-at-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
