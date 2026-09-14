import Image from "next/image";
import Link from "next/link";
import type { QuizSummary } from "@/lib/types";

/**
 * Bordered quiz card in the Airtable editorial grammar.
 *  - Distinct card surface (soft) against the page canvas.
 *  - Deliberate 1px hairline border + at-md radius.
 *  - Rest + hover elevation (lift) to signal it's tappable.
 *  - Thumbnail keeps a consistent aspect ratio with matching rounded corners.
 *
 * `compact` renders the tighter sidebar version.
 */
export function QuizCard({
  quiz,
  compact = false,
}: {
  quiz: QuizSummary;
  compact?: boolean;
}) {
  const thumbSize = compact ? "h-[56px] w-[80px]" : "h-[84px] w-[120px]";
  const titleType = compact ? "text-at-label-md" : "text-at-title-sm";

  return (
    <Link
      href={`/play/${quiz.id}`}
      className="group flex items-stretch gap-md rounded-at-md border border-at-hairline bg-at-surface-soft p-md no-underline shadow-at-card transition-all duration-150 hover:-translate-y-[2px] hover:border-at-border-strong hover:shadow-at-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
    >
      {/* Thumbnail — consistent aspect ratio, radius matches the card */}
      <div
        className={`relative ${thumbSize} flex-none overflow-hidden rounded-at-sm border border-at-hairline bg-at-canvas`}
      >
        <Image
          src={quiz.thumbnail}
          alt=""
          fill
          sizes="120px"
          className="object-cover"
        />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-col justify-center">
        <div className="flex items-center gap-xs">
          <span className="rounded-at-xs bg-at-cream px-[6px] py-[2px] font-haas text-[11px] font-medium uppercase tracking-wide text-at-ink">
            {quiz.category}
          </span>
          <span className="font-haas text-at-caption text-at-muted">
            Top {quiz.listLength}
          </span>
        </div>
        <h3
          className={`mt-[6px] font-haas ${titleType} font-medium text-at-link transition-colors group-hover:text-at-link-active`}
        >
          {quiz.title}
        </h3>
        {!compact && (
          <p className="mt-[4px] line-clamp-2 font-haas text-at-body-md text-at-body">
            {quiz.description}
          </p>
        )}
      </div>
    </Link>
  );
}
