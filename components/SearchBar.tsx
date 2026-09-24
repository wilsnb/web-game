"use client";

import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type Ref,
} from "react";
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
 *
 * Desktop: inline field in the nav. Phone: a search icon that opens a
 * full-width overlay so the bar isn't cramped.
 */
export function SearchBar({ index }: { index: SearchItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!showMenu && !mobileOpen) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !desktopRef.current?.contains(target) &&
        !mobileRef.current?.contains(target)
      ) {
        setOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showMenu, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    mobileInputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const go = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setMobileOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router]
  );

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setMobileOpen(false);
    }
  }

  const field = (inputRef?: Ref<HTMLInputElement>) => (
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
        ref={inputRef}
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
        className="h-[40px] w-full rounded-at-sm border border-at-hairline bg-at-canvas pl-[36px] pr-[12px] font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
      />
    </label>
  );

  const resultsMenu = (
    <div
      role="listbox"
      className="motion-rise absolute left-0 right-0 top-[calc(100%+8px)] z-50 origin-top overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
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
            className={`flex w-full flex-col items-start px-md py-[8px] text-left transition-colors duration-fast ease-soft ${
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
  );

  return (
    <>
      {/* Phone: icon that opens a full-width overlay */}
      <div ref={mobileRef} className="relative md:hidden">
        <button
          type="button"
          aria-label="Search games and categories"
          onClick={() => {
            setMobileOpen(true);
            setOpen(true);
          }}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-at-sm text-at-ink transition-colors duration-fast ease-soft hover:bg-at-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-0 z-[60] border-b border-at-hairline bg-at-canvas px-md py-sm md:hidden">
          <div className="relative flex items-center gap-xs">
            <div className="relative min-w-0 flex-1">
              {field(mobileInputRef)}
              {showMenu && resultsMenu}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setOpen(false);
                setQuery("");
              }}
              className="shrink-0 px-sm py-[8px] font-haas text-at-body-md text-at-link"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop: inline field */}
      <div
        ref={desktopRef}
        className="relative hidden max-w-[320px] flex-1 md:block"
      >
        {field()}
        {showMenu && resultsMenu}
      </div>
    </>
  );
}
