"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SearchItem } from "@/data/catalog";
import { SearchBar } from "./SearchBar";

/** Minimal category shape the nav dropdown needs. */
export interface NavCategory {
  slug: string;
  label: string;
  count: number;
  /** Dedicated category page, e.g. "/category/trivia-rankings". */
  href: string;
}

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
  searchIndex = [],
}: {
  categories: NavCategory[];
  quizIds: string[];
  user?: NavUser | null;
  searchIndex?: SearchItem[];
}) {
  const router = useRouter();

  const goRandom = useCallback(() => {
    if (quizIds.length === 0) return;
    const id = quizIds[Math.floor(Math.random() * quizIds.length)];
    router.push(`/play/${id}`);
  }, [quizIds, router]);

  const linkClass =
    "whitespace-nowrap rounded-at-sm px-[6px] py-[6px] font-haas text-at-body-md text-at-link no-underline transition-colors duration-fast ease-soft hover:text-at-link-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link";

  return (
    <div className="sticky top-0 z-50 w-full border-b border-at-hairline bg-at-canvas">
      <nav aria-label="Primary" className="relative mx-auto max-w-[1280px] px-md sm:px-lg">
        <div className="flex h-[56px] items-center gap-xs md:h-[64px] md:gap-md">
          <Link
            href="/"
            className="flex shrink-0 items-center no-underline"
            aria-label="Qwardoo home"
          >
            <Image
              src="/logo.jpg"
              alt="Qwardoo"
              width={664}
              height={190}
              priority
              className="h-[26px] w-auto md:h-[32px]"
            />
          </Link>

          <div className="hidden items-center md:flex">
            <CategoriesDropdown categories={categories} />
            <button type="button" onClick={goRandom} className={linkClass}>
              Random
            </button>
            <Link href="/leaderboard" className={linkClass}>
              Leaderboard
            </Link>
          </div>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-xxs md:ml-md md:flex-1 md:justify-center md:gap-md">
            <SearchBar index={searchIndex} />
          </div>

          <Link
            href="/subscribe"
            className="hidden whitespace-nowrap rounded-at-sm px-[6px] py-[6px] font-haas text-at-body-md font-medium text-at-coral no-underline transition-all duration-fast ease-soft hover:opacity-80 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link md:ml-md md:inline-flex"
          >
            Go Premium
          </Link>

          <div className="flex shrink-0 items-center">
            <AuthArea user={user} />
          </div>
        </div>

        {/* Phone: links that don't fit the top row live here. */}
        <div className="flex h-[44px] items-center gap-xs overflow-x-auto border-t border-at-hairline md:hidden">
          <CategoriesDropdown categories={categories} />
          <button type="button" onClick={goRandom} className={linkClass}>
            Random
          </button>
          <Link href="/leaderboard" className={linkClass}>
            Leaderboard
          </Link>
          <Link
            href="/subscribe"
            className="ml-auto whitespace-nowrap rounded-at-sm px-[6px] py-[6px] font-haas text-at-body-md font-medium text-at-coral no-underline"
          >
            Go Premium
          </Link>
        </div>
      </nav>
    </div>
  );
}

/** Kick off Google OAuth (same flow for both log in and create account). */
async function startGoogle() {
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  // On success the browser redirects to Google.
}

/**
 * Auth area.
 *  - Signed out: two visible buttons — "Log in" (secondary) and
 *    "Create account" (primary). Both use the same Google flow (Google sign-in
 *    is also the sign-up path).
 *  - Signed in: an avatar button that opens a dropdown — Your account,
 *    Your stats, Log out. The first two link to the full /account page.
 */
function AuthArea({ user }: { user: NavUser | null }) {
  if (!user) return <LoggedOutButtons />;
  return <AccountMenu user={user} />;
}

function LoggedOutButtons() {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await startGoogle();
  }

  return (
    <div className="flex items-center gap-xs">
      {/* Phone: one compact control — two full buttons overflow the bar. */}
      <Link
        href="/login"
        className="rounded-at-lg bg-at-primary px-sm py-[8px] font-haas text-at-body-md font-medium text-at-on-dark no-underline md:hidden"
      >
        Log in
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={go}
        className="hidden rounded-at-lg border border-at-hairline bg-at-canvas px-md py-[8px] font-haas text-at-body-md font-medium text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:shadow-at-card hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60 md:inline-flex"
      >
        Log in
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={go}
        className="hidden rounded-at-lg bg-at-primary px-md py-[8px] font-haas text-at-body-md font-medium text-at-on-dark transition-all duration-base ease-soft hover:bg-at-primary-active hover:shadow-at-card-hover hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60 md:inline-flex"
      >
        {busy ? "…" : "Create account"}
      </button>
    </div>
  );
}

/**
 * Signed-in avatar dropdown: Your account, Your stats, Log out.
 * Keyboard accessible; closes on outside click and Escape.
 */
function AccountMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(true);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function signOut() {
    setBusy(true);
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/client"
    );
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // Hard navigation so server components re-read the (now cleared) session.
    window.location.assign("/");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full border border-at-hairline bg-at-canvas text-at-ink transition-all duration-base ease-soft hover:shadow-at-card hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-[38px] w-[38px] rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center rounded-full bg-at-cream font-haas text-at-caption font-medium text-at-ink"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="motion-rise absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] origin-top-right overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
        >
          <div className="border-b border-at-hairline px-md py-sm">
            <div className="font-haas text-at-body-md font-medium text-at-ink">
              {user.name}
            </div>
            {user.email && (
              <div className="truncate font-haas text-at-caption text-at-muted">
                {user.email}
              </div>
            )}
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => close()}
            className="flex items-center px-md py-[10px] font-haas text-at-body-md text-at-ink no-underline outline-none transition-colors duration-fast ease-soft hover:bg-at-surface-soft focus:bg-at-surface-soft"
          >
            Your account
          </Link>
          <Link
            href="/account/stats"
            role="menuitem"
            onClick={() => close()}
            className="flex items-center px-md py-[10px] font-haas text-at-body-md text-at-ink no-underline outline-none transition-colors duration-fast ease-soft hover:bg-at-surface-soft focus:bg-at-surface-soft"
          >
            Your stats
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={signOut}
            className="flex w-full items-center border-t border-at-hairline px-md py-[10px] text-left font-haas text-at-body-md text-at-ink outline-none transition-colors duration-fast ease-soft hover:bg-at-surface-soft focus:bg-at-surface-soft disabled:opacity-60"
          >
            {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

function CategoriesDropdown({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const menuId = useId();

  // "All games" leads the list, then each category.
  const items: Array<{ key: string; label: string; href: string; count?: number }> =
    [
      { key: "all", label: "All games", href: "/category" },
      ...categories.map((c) => ({
        key: c.slug,
        label: c.label,
        href: c.href,
        count: c.count,
      })),
    ];

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
        openMenu(items.length - 1);
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
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
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
        className="flex items-center gap-[4px] rounded-at-sm px-[6px] py-[6px] font-haas text-at-body-md text-at-ink transition-colors duration-fast ease-soft hover:text-at-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
      >
        Menu
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`h-[14px] w-[14px] transition-transform duration-base ease-soft ${
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
          aria-label="Game categories"
          className="motion-rise absolute left-0 top-[calc(100%+8px)] z-50 w-[260px] origin-top-left overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
        >
          {items.map((item, i) => (
            <Link
              key={item.key}
              href={item.href}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="menuitem"
              tabIndex={activeIndex === i ? 0 : -1}
              onKeyDown={onItemKeyDown}
              onClick={() => close()}
              className={`flex items-center justify-between px-md py-[10px] font-haas text-at-body-md no-underline outline-none transition-colors duration-fast ease-soft hover:bg-at-surface-soft hover:text-at-link focus:bg-at-surface-soft focus:text-at-link ${
                item.key === "all"
                  ? "border-b border-at-hairline font-medium text-at-ink"
                  : "text-at-body"
              }`}
            >
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span className="font-haas text-at-caption text-at-muted">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
