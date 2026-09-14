"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CategoryGroup } from "@/lib/categories";

export interface NavUser {
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Airtable-style top-nav: 64px white bar, dark-ink wordmark, hairline base.
 * MVP scope: logo + a single-column Categories dropdown + a Random link,
 * and an auth area (Sign in link, or the signed-in user + Sign out).
 */
export function Navbar({
  categories,
  quizIds,
  user = null,
}: {
  categories: CategoryGroup[];
  quizIds: string[];
  user?: NavUser | null;
}) {
  const router = useRouter();

  const goRandom = useCallback(() => {
    if (quizIds.length === 0) return;
    const id = quizIds[Math.floor(Math.random() * quizIds.length)];
    router.push(`/play/${id}`);
  }, [quizIds, router]);

  return (
    <div className="w-full border-b border-at-hairline bg-at-canvas">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[64px] max-w-[1280px] items-center gap-md px-md sm:px-lg"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-xs font-haas text-at-title-sm font-medium text-at-ink no-underline"
        >
          <span
            aria-hidden
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-at-sm bg-at-coral text-at-on-dark"
          >
            #
          </span>
          Ranked
        </Link>

        {/* Categories dropdown */}
        <CategoriesDropdown categories={categories} />

        {/* Random */}
        <button
          type="button"
          onClick={goRandom}
          className="font-haas text-at-body-md text-at-link transition-colors hover:text-at-link-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link rounded-at-sm px-[6px] py-[6px]"
        >
          Random
        </button>

        {/* Auth area (far right) */}
        <div className="ml-auto flex items-center">
          {user ? (
            <AuthMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="rounded-at-lg bg-at-primary px-md py-[8px] font-haas text-at-body-md font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

/** Signed-in user: shows name/avatar and a sign-out form (POST /auth/signout). */
function AuthMenu({ user }: { user: NavUser }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex items-center gap-xs">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-[28px] w-[28px] rounded-full border border-at-hairline object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-at-cream font-haas text-at-caption font-medium text-at-ink"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden font-haas text-at-body-md text-at-ink sm:inline">
          {user.name}
        </span>
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-at-sm border border-at-hairline bg-at-canvas px-[10px] py-[6px] font-haas text-at-body-md text-at-ink transition-all hover:border-at-border-strong hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function CategoriesDropdown({ categories }: { categories: CategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const menuId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    setActiveIndex(-1);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // Move DOM focus to the active item as it changes.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const openMenu = useCallback((index: number) => {
    setOpen(true);
    setActiveIndex(index);
  }, []);

  function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        e.preventDefault();
        openMenu(0);
        break;
      case "ArrowUp":
        e.preventDefault();
        openMenu(categories.length - 1);
        break;
      case "Escape":
        close();
        break;
    }
  }

  function onItemKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % categories.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + categories.length) % categories.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(categories.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close();
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close() : openMenu(-1))}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-[4px] rounded-at-sm px-[6px] py-[6px] font-haas text-at-body-md text-at-ink transition-colors hover:text-at-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
      >
        Categories
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`h-[14px] w-[14px] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Quiz categories"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[240px] overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
        >
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/#${cat.slug}`}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="menuitem"
              tabIndex={activeIndex === i ? 0 : -1}
              onKeyDown={onItemKeyDown}
              onClick={() => close()}
              className="flex items-center justify-between px-md py-[10px] font-haas text-at-body-md text-at-body no-underline outline-none transition-colors hover:bg-at-surface-soft hover:text-at-link focus:bg-at-surface-soft focus:text-at-link"
            >
              <span>{cat.label}</span>
              <span className="font-haas text-at-caption text-at-muted">
                {cat.quizzes.length}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
