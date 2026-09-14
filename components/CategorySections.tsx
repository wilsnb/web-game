"use client";

import { useEffect, useState } from "react";
import type { CategoryGroup } from "@/lib/categories";
import { QuizCard } from "./QuizCard";

/**
 * Homepage category sections, each with an anchor id so the navbar's
 * Categories dropdown can scroll to it (via `/#category-<name>`) and
 * briefly highlight it.
 */
export function CategorySections({ groups }: { groups: CategoryGroup[] }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    function handleHash() {
      const slug = window.location.hash.replace(/^#/, "");
      if (!slug) return;
      const el = document.getElementById(slug);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlighted(slug);
      // Clear the highlight after the pulse so it can re-trigger later.
      const t = setTimeout(() => setHighlighted(null), 1600);
      return () => clearTimeout(t);
    }

    // Run once for a hash present on load, and on every hashchange.
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="flex flex-col gap-xl">
      {groups.map((group) => {
        const isHi = highlighted === group.slug;
        return (
          <section
            key={group.slug}
            id={group.slug}
            aria-labelledby={`${group.slug}-heading`}
            className={`scroll-mt-[88px] rounded-at-md transition-all duration-300 ${
              isHi
                ? "bg-at-cream/60 shadow-at-card ring-2 ring-at-coral"
                : "ring-0"
            }`}
          >
            <div className={isHi ? "p-md" : ""}>
              <div className="mb-md flex items-baseline justify-between">
                <h2
                  id={`${group.slug}-heading`}
                  className="font-haas text-at-title-lg font-normal text-at-ink"
                >
                  {group.label}
                </h2>
                <span className="font-haas text-at-body-md text-at-muted">
                  {group.quizzes.length}{" "}
                  {group.quizzes.length === 1 ? "quiz" : "quizzes"}
                </span>
              </div>
              <ul className="flex flex-col gap-md">
                {group.quizzes.map((quiz) => (
                  <li key={quiz.id}>
                    <QuizCard quiz={quiz} />
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
