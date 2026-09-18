import Link from "next/link";

/**
 * "See it in action" — a static, illustrative mockup of a ranked-list round
 * (the flagship game type) plus a plain-language explanation of rank scoring.
 * Not interactive; purely presentational.
 */
export function DemoSection({ playHref }: { playHref: string | null }) {
  return (
    <section className="bg-at-surface-dark">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-xl px-md py-section sm:px-lg lg:grid-cols-2">
        {/* Explanation */}
        <div>
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-peach">
            See it in action
          </p>
          <h2 className="mt-xs font-haas text-at-display-md font-normal text-at-on-dark">
            Guess the ranked list. Closer to #1 scores more.
          </h2>
          <p className="mt-md max-w-[520px] font-haas text-at-title-md font-normal text-at-body-muted">
            Take turns naming entries on a Top&nbsp;100 list. Every correct guess
            scores points based on its rank — nail the&nbsp;#1 answer and you bank
            the most, while lower spots are worth less. Highest total after the
            final round wins.
          </p>

          {playHref ? (
            <Link
              href={playHref}
              className="mt-lg inline-flex items-center justify-center rounded-at-lg bg-at-canvas px-lg py-md font-haas text-at-button font-medium text-at-ink no-underline transition-transform hover:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-info-border"
            >
              Play a ranked quiz
            </Link>
          ) : (
            <p className="mt-lg font-haas text-at-body-md text-at-body-muted">
              Ranked-list quizzes are coming soon.
            </p>
          )}
        </div>

        {/* Static round mockup */}
        <div aria-hidden className="rounded-at-lg bg-at-canvas p-lg shadow-at-card">
          <p className="font-haas text-at-caption uppercase tracking-wide text-at-muted">
            Round 2 · Player 2&apos;s turn
          </p>
          <h3 className="mt-xxs font-haas text-at-title-md text-at-ink">
            Top 100 Most Streamed Artists
          </h3>

          {/* Mock guess input */}
          <div className="mt-md flex items-center gap-sm">
            <div className="flex h-[44px] flex-1 items-center rounded-at-sm border border-at-hairline px-md font-haas text-at-body-md text-at-ink">
              The Weeknd
            </div>
            <div className="flex h-[44px] items-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark">
              Guess
            </div>
          </div>

          {/* Score reveal */}
          <div className="mt-md flex items-center justify-between rounded-at-md border border-at-hairline bg-at-surface-soft p-md">
            <div>
              <div className="font-haas text-at-body-md text-at-muted">
                Correct — rank
              </div>
              <div className="font-haas text-at-title-lg text-at-ink">#3</div>
            </div>
            <div className="text-right">
              <div className="font-haas text-at-body-md text-at-muted">
                Points
              </div>
              <div className="font-haas text-at-title-lg text-at-success">
                +98
              </div>
            </div>
          </div>

          {/* Mini scoreboard */}
          <div className="mt-md flex flex-col gap-xs">
            <div className="flex items-center justify-between font-haas text-at-body-md text-at-ink">
              <span>Player 1</span>
              <span>241</span>
            </div>
            <div className="flex items-center justify-between font-haas text-at-body-md text-at-ink">
              <span className="font-medium">Player 2</span>
              <span className="font-medium">265</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
