import Link from "next/link";
import type { QuizSummary } from "@/lib/types";

/** Category label styled as a quiet pearl capsule. */
function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-pearl px-[14px] py-[8px] text-caption capitalize text-ink-muted-80">
      {category}
    </span>
  );
}

/**
 * store-utility-card grammar: white canvas, 1px hairline, rounded-lg, 24px padding.
 * The whole card is a full page navigation into /play/[category].
 */
export function CategoryCard({ quiz }: { quiz: QuizSummary }) {
  return (
    <Link
      href={`/play/${quiz.id}`}
      className="focus-ring press-scale group flex flex-col justify-between rounded-lg border border-hairline bg-canvas p-lg no-underline"
    >
      <div className="flex flex-col gap-sm">
        <CategoryTag category={quiz.category} />
        <h3 className="text-body-strong font-semibold text-ink">{quiz.title}</h3>
      </div>
      <div className="mt-lg flex items-center justify-between">
        <span className="text-caption text-ink-muted-48">
          Top {quiz.listLength}
        </span>
        <span className="text-body-apple text-primary">Play →</span>
      </div>
    </Link>
  );
}
