"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Landing hero — multi-category value prop (not niche-specific).
 * Primary CTA scrolls to the category sections; secondary plays a random game.
 */
export function Hero({ quizIds }: { quizIds: string[] }) {
  const router = useRouter();

  const playRandom = useCallback(() => {
    if (quizIds.length === 0) return;
    const id = quizIds[Math.floor(Math.random() * quizIds.length)];
    router.push(`/play/${id}`);
  }, [quizIds, router]);

  return (
    <section className="bg-at-canvas">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-xl px-md py-section sm:px-lg lg:grid-cols-[1.1fr_0.9fr]">
        {/* Copy */}
        <div>
          <h1 className="font-haas text-at-display-md font-normal leading-tight text-at-ink sm:text-[48px]">
            One hub for quizzes, party games, and quick activities.
          </h1>
          <p className="mt-md max-w-[560px] font-haas text-at-title-md font-normal text-at-body">
            Trivia rankings, party games, couples games and brain teasers — all
            pass-and-play on one shared device. No downloads, no setup.
          </p>
          <div className="mt-lg flex flex-col gap-sm sm:flex-row">
            <Link
              href="#categories"
              className="inline-flex items-center justify-center rounded-at-lg bg-at-primary px-lg py-md font-haas text-at-button font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              Browse Categories
            </Link>
            <button
              type="button"
              onClick={playRandom}
              className="inline-flex items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg py-md font-haas text-at-button font-medium text-at-ink transition-all hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              Play a Random Game
            </button>
          </div>
        </div>

        {/* Abstract "variety / fun" visual — simple shapes, no niche imagery */}
        <div aria-hidden className="hidden lg:block">
          <HeroArtwork />
        </div>
      </div>
    </section>
  );
}

/** Abstract graphic: overlapping game-card shapes in the signature palette. */
function HeroArtwork() {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-[440px]">
      <div className="absolute left-[8%] top-[14%] h-[150px] w-[210px] -rotate-6 rounded-at-lg bg-at-coral shadow-at-card" />
      <div className="absolute right-[6%] top-[6%] h-[130px] w-[150px] rotate-6 rounded-at-lg bg-at-forest shadow-at-card" />
      <div className="absolute bottom-[8%] left-[18%] h-[150px] w-[240px] rotate-3 rounded-at-lg bg-at-cream shadow-at-card" />
      <div className="absolute bottom-[20%] right-[10%] flex h-[92px] w-[92px] items-center justify-center rounded-full bg-at-surface-dark text-[34px] text-at-on-dark shadow-at-card">
        #1
      </div>
      <div className="absolute left-[40%] top-[40%] h-[46px] w-[46px] rounded-full bg-at-yellow shadow-at-card" />
    </div>
  );
}
