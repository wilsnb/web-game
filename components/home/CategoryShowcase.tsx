import Link from "next/link";
import type { CatalogCategory } from "@/data/catalog";
import { urlSlug } from "@/data/catalog";
import { GameCard } from "@/components/GameCard";

/**
 * One homepage category section: header (name + one-line description), a grid
 * of that category's game cards, and a "Browse all" link to the category page.
 */
export function CategoryShowcase({ category }: { category: CatalogCategory }) {
  const slug = urlSlug(category);

  return (
    <section aria-labelledby={`${category.slug}-home-heading`}>
      <div className="mb-md flex flex-wrap items-end justify-between gap-sm">
        <div>
          <h3
            id={`${category.slug}-home-heading`}
            className="font-haas text-at-title-lg font-normal text-at-ink"
          >
            {category.label}
          </h3>
          <p className="mt-xxs font-haas text-at-body-md text-at-muted">
            {category.description}
          </p>
        </div>
        <Link
          href={`/category/${slug}`}
          className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
        >
          Browse all {category.label} →
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-md sm:grid-cols-2">
        {category.games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} thumbnail={category.thumbnail} />
          </li>
        ))}
      </ul>
    </section>
  );
}
