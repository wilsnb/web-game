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
    // Fill the viewport below the 64px nav so the stats bar sits below the fold.
    // Transparent so the animated ambient gradient shows through.
    <section className="flex min-h-[calc(100vh-64px)] items-center">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-xl px-md py-section sm:px-lg lg:grid-cols-[1.1fr_0.9fr]">
        {/* Copy */}
        <div>
          <h1 className="font-haas text-[40px] font-normal leading-[1.05] text-at-ink sm:text-[64px] lg:text-[72px]">
            One hub for quizzes, party games, and quick activities.
          </h1>
          <p className="mt-lg max-w-[600px] font-haas text-at-title-md font-normal text-at-body sm:text-at-title-lg">
            Trivia rankings, party games, couples games and brain teasers — all
            pass-and-play on one shared device. No downloads, no setup.
          </p>
          <div className="mt-xl flex flex-col gap-sm sm:flex-row">
            <Link
              href="#games"
              className="inline-flex items-center justify-center rounded-at-lg bg-at-primary px-lg py-md font-haas text-at-button font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              Browse Games
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

/**
 * Abstract graphic: overlapping game-card shapes in the signature palette.
 * On hover the pieces gently fan apart (each drifts a short distance in its own
 * direction) and ease back to their resting cluster when the pointer leaves.
 */
function HeroArtwork() {
  // shared transition for the spread-on-hover effect
  const t = "transition-transform duration-500 ease-out";
  return (
    <div className="group relative mx-auto h-[400px] w-full max-w-[500px]">
      {/* coral — drifts up-left */}
      <div
        className={`absolute left-[8%] top-[14%] h-[150px] w-[210px] -rotate-6 rounded-at-lg bg-at-coral shadow-at-card ${t} group-hover:-translate-x-[24px] group-hover:-translate-y-[18px] group-hover:-rotate-[10deg]`}
      />
      {/* forest — drifts up-right */}
      <div
        className={`absolute right-[6%] top-[6%] h-[130px] w-[150px] rotate-6 rounded-at-lg bg-at-forest shadow-at-card ${t} group-hover:translate-x-[26px] group-hover:-translate-y-[16px] group-hover:rotate-[10deg]`}
      />
      {/* cream — drifts down-left */}
      <div
        className={`absolute bottom-[8%] left-[18%] h-[150px] w-[240px] rotate-3 rounded-at-lg bg-at-cream shadow-at-card ${t} group-hover:-translate-x-[20px] group-hover:translate-y-[22px] group-hover:rotate-[6deg]`}
      />
      {/* #1 circle — drifts down-right */}
      <div
        className={`absolute bottom-[20%] right-[10%] flex h-[92px] w-[92px] items-center justify-center rounded-full bg-at-surface-dark text-[34px] text-at-on-dark shadow-at-card ${t} group-hover:translate-x-[22px] group-hover:translate-y-[18px]`}
      >
        #1
      </div>
      {/* yellow dot — drifts up slightly */}
      <div
        className={`absolute left-[40%] top-[40%] h-[46px] w-[46px] rounded-full bg-at-yellow shadow-at-card ${t} group-hover:-translate-y-[26px]`}
      />
    </div>
  );
}
