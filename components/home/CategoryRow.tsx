"use client";

import { useRef } from "react";
import Link from "next/link";
import type { CatalogCategory } from "@/data/catalog";
import { urlSlug } from "@/data/catalog";
import { GameCard } from "@/components/GameCard";

const MAX_TILES = 8;

/**
 * One category as a horizontal, swipeable row of game tiles.
 *  - Free horizontal scroll/swipe (touch + trackpad).
 *  - Desktop left/right arrow buttons scroll the row.
 *  - Caps at MAX_TILES; a "View all" link goes to the full category page.
 */
export function CategoryRow({ category }: { category: CatalogCategory }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const slug = urlSlug(category);

  // TEMP: repeat the real games to ~10 so the carousel has enough to scroll
  // while categories are still thin. Remove once categories have real content.
  const padded =
    category.games.length > 0
      ? Array.from({ length: 10 }, (_, i) => category.games[i % category.games.length])
      : [];

  const tiles = padded.slice(0, MAX_TILES);
  const hasMore = padded.length > MAX_TILES;

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <section aria-labelledby={`${category.slug}-row-heading`}>
      <div className="mb-sm flex items-end justify-between gap-sm">
        <div>
          <h3
            id={`${category.slug}-row-heading`}
            className="font-haas text-at-title-lg font-normal text-at-ink"
          >
            {category.label}
          </h3>
          <p className="font-haas text-at-caption text-at-muted">
            {category.description}
          </p>
        </div>

        <div className="flex flex-none items-center gap-xs">
          <Link
            href={`/category/${slug}`}
            className="font-haas text-at-body-md text-at-link no-underline transition-colors duration-fast ease-soft hover:text-at-link-active"
          >
            View all →
          </Link>
          {/* Desktop scroll arrows */}
          <div className="hidden items-center gap-xxs sm:flex">
            <button
              type="button"
              aria-label={`Scroll ${category.label} left`}
              onClick={() => scrollBy(-1)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-at-hairline bg-at-canvas text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${category.label} right`}
              onClick={() => scrollBy(1)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-at-hairline bg-at-canvas text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipeable row */}
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-md overflow-x-auto scroll-smooth pb-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tiles.map((game, i) => (
          <li
            key={`${game.id}-${i}`}
            className="w-[260px] flex-none snap-start sm:w-[300px]"
          >
            <GameCard game={game} thumbnail={category.thumbnail} layout="tile" />
          </li>
        ))}

        {hasMore && (
          <li className="flex w-[180px] flex-none snap-start items-center justify-center">
            <Link
              href={`/category/${slug}`}
              className="flex h-full w-full items-center justify-center rounded-at-md border border-dashed border-at-hairline bg-at-surface-soft/60 px-md py-lg text-center font-haas text-at-body-md font-medium text-at-link no-underline transition-all duration-base ease-soft hover:border-at-border-strong hover:text-at-link-active hover:-translate-y-[2px]"
            >
              View all
              <br />
              {category.label} →
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-[14px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {dir === "left" ? (
        <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
