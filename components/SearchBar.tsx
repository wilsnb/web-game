"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/data/catalog";

/** Normalize for case/space-insensitive substring matching. */
function norm(s: string) {
  return s.toLowerCase().trim();
}

/**
 * Functional site search. Filters the catalog search index (games +
 * categories) by title/subtitle as you type, shows live results in a
 * dropdown, and navigates on select. Keyboard accessible.
 */
export function SearchBar({ index }: { index: SearchItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return index
      .filter(
        (it) => norm(it.title).includes(q) || norm(it.subtitle).includes(q)
      )
      .slice(0, 8);
  }, [query, index]);

  const showMenu = open && query.trim().length > 0;

  // Close on outside click.
  useEffect(() => {
    if (!showMenu) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showMenu]);

  const go = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative hidden max-w-[320px] flex-1 md:block">
      <label className="relative block">
        <span className="sr-only">Search games and categories</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-[12px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-at-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search games or categories"
          role="combobox"
          aria-expanded={showMenu}
          aria-autocomplete="list"
          className="h-[40px] w-full rounded-at-sm border border-at-hairline bg-at-canvas pl-[36px] pr-[12px] font-haas text-at-body-md text-at-ink placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
        />
      </label>

      {showMenu && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
        >
          {results.length === 0 ? (
            <p className="px-md py-[10px] font-haas text-at-body-md text-at-muted">
              No matches for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((item, i) => (
              <button
                key={`${item.type}-${item.title}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={`flex w-full flex-col items-start px-md py-[8px] text-left transition-colors ${
                  i === active ? "bg-at-surface-soft" : ""
                }`}
              >
                <span className="flex items-center gap-xs font-haas text-at-body-md font-medium text-at-ink">
                  {item.title}
                  {item.type === "category" && (
                    <span className="rounded-at-xs bg-at-cream px-[5px] py-[1px] font-haas text-[10px] uppercase tracking-wide text-at-ink">
                      Category
                    </span>
                  )}
                  {item.comingSoon && (
                    <span className="rounded-at-xs bg-at-surface-strong px-[5px] py-[1px] font-haas text-[10px] uppercase tracking-wide text-at-muted">
                      Soon
                    </span>
                  )}
                </span>
                <span className="line-clamp-1 font-haas text-at-caption text-at-muted">
                  {item.subtitle}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
