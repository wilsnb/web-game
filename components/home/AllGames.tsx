import Link from "next/link";
import { CATALOG } from "@/data/catalog";
import { CategoryRow } from "./CategoryRow";

/**
 * "All games & activities" — one horizontal, swipeable row per category
 * (Trivia & Rankings first, following catalog order). Each row caps at 8
 * tiles with a "View all" link to the full category page.
 */
export function AllGames() {
  return (
    <section id="games" className="scroll-mt-[72px]">
      <div className="mx-auto max-w-[1280px] px-md py-section sm:px-lg">
        <div className="mb-xl">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
            All games &amp; activities
          </p>
          <h2 className="mt-xxs font-haas text-at-display-md font-normal text-at-ink">
            Pick a game and play
          </h2>
        </div>

        <div className="flex flex-col gap-xl">
          {CATALOG.map((category) => (
            <CategoryRow key={category.slug} category={category} />
          ))}
        </div>

        <div className="mt-xl flex justify-center">
          <Link
            href="/category"
            className="inline-flex items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg py-md font-haas text-at-button font-medium text-at-ink no-underline transition-all hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
          >
            Browse all games
          </Link>
        </div>
      </div>
    </section>
  );
}
