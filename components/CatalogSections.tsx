"use client";

import { useEffect, useState } from "react";
import type { CatalogCategory } from "@/data/catalog";
import { GameCard } from "./GameCard";

/**
 * Homepage catalog sections — one per game category, each with an anchor id
 * so the navbar Categories dropdown can scroll to it (via `/#<slug>`) and
 * briefly highlight it.
 */
export function CatalogSections({
  categories,
}: {
  categories: CatalogCategory[];
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    function handleHash() {
      const slug = window.location.hash.replace(/^#/, "");
      if (!slug) return;
      const el = document.getElementById(slug);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlighted(slug);
      const t = setTimeout(() => setHighlighted(null), 1600);
      return () => clearTimeout(t);
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="flex flex-col gap-xl">
      {categories.map((cat) => {
        const isHi = highlighted === cat.slug;
        return (
          <section
            key={cat.slug}
            id={cat.slug}
            aria-labelledby={`${cat.slug}-heading`}
            className={`scroll-mt-[88px] rounded-at-md transition-all duration-300 ${
              isHi ? "bg-at-cream/60 shadow-at-card ring-2 ring-at-coral" : "ring-0"
            }`}
          >
            <div className={isHi ? "p-md" : ""}>
              <div className="mb-xs flex items-baseline justify-between">
                <h2
                  id={`${cat.slug}-heading`}
                  className="font-haas text-at-title-lg font-normal text-at-ink"
                >
                  {cat.label}
                </h2>
                <span className="font-haas text-at-body-md text-at-muted">
                  {cat.games.length}{" "}
                  {cat.games.length === 1 ? "game" : "games"}
                </span>
              </div>
              <p className="mb-md font-haas text-at-body-md text-at-muted">
                {cat.description}
              </p>
              <ul className="flex flex-col gap-md">
                {cat.games.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game} thumbnail={cat.thumbnail} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
