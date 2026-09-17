import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCategoryUrlSlugs,
  getCategoryByUrlSlug,
} from "@/data/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GameCard } from "@/components/GameCard";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** One static page per category. */
export function generateStaticParams() {
  return getAllCategoryUrlSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryByUrlSlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.label,
    description: `${category.label} — ${category.description} Browse the games in this category on Qwardoo.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryByUrlSlug(slug);

  if (!category) notFound();

  const available = category.games.filter((g) => !g.comingSoon).length;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Header band */}
      <section className="bg-at-canvas/70 backdrop-blur-sm">
        <div className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
          <nav aria-label="Breadcrumb" className="mb-sm">
            <Link
              href="/category"
              className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
            >
              All games
            </Link>
            <span className="px-xs font-haas text-at-body-md text-at-muted">
              /
            </span>
            <span className="font-haas text-at-body-md text-at-muted">
              {category.label}
            </span>
          </nav>
          <h1 className="font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
            {category.label}
          </h1>
          <p className="mt-sm max-w-[640px] font-haas text-at-title-md font-normal text-at-body">
            {category.description}
          </p>
          <p className="mt-sm font-haas text-at-body-md text-at-muted">
            {category.games.length}{" "}
            {category.games.length === 1 ? "game" : "games"}
            {available > 0 && ` · ${available} playable`}
          </p>
        </div>
      </section>

      {/* Games in this category only */}
      <section className="mx-auto max-w-[1280px] px-md py-xl sm:px-lg">
        <ul className="flex flex-col gap-md">
          {category.games.map((game) => (
            <li key={game.id}>
              <GameCard game={game} thumbnail={category.thumbnail} />
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  );
}
