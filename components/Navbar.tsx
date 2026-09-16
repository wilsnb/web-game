"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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
}: {
  categories: NavCategory[];
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
    <div className="sticky top-0 z-50 w-full border-b border-at-hairline bg-at-canvas">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[64px] max-w-[1280px] items-center gap-md px-md sm:px-lg"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center no-underline" aria-label="Qwardoo home">
          <Image
            src="/logo.jpg"
            alt="Qwardoo"
            width={664}
            height={190}
            priority
            className="h-[32px] w-auto"
          />
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

        {/* Go Pro (subscription) */}
        <Link
          href="/subscribe"
          className="font-haas text-at-body-md font-medium text-at-coral no-underline transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link rounded-at-sm px-[6px] py-[6px]"
        >
          Go Pro
        </Link>

        {/* Auth area (far right) — icon button with dropdown */}
        <div className="ml-auto flex items-center">
          <AccountMenu user={user} />
        </div>
      </nav>
    </div>
  );
}

/** Small Google "G" glyph for the sign-in option. */
function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-[16px] w-[16px] flex-none">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

/**
 * Account icon button with a dropdown.
 *  - Signed out: a person icon → dropdown with "Sign in" and
 *    "Continue with Google" (Google is also the sign-up path for new users).
 *  - Signed in: the user's avatar/initial → dropdown showing name/email and
 *    a "Sign out" action.
 * Keyboard accessible; closes on outside click and Escape.
 */
function AccountMenu({ user }: { user: NavUser | null }) {
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

  async function continueWithGoogle() {
    setBusy(true);
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/client"
    );
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setBusy(false);
    // On success the browser redirects to Google.
  }

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
        aria-label={user ? "Account menu" : "Sign in menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-at-hairline bg-at-canvas text-at-ink transition-shadow hover:shadow-at-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
      >
        {user ? (
          user.avatarUrl ? (
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
          )
        ) : (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-[20px] w-[20px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={user ? "Account" : "Sign in"}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
        >
          {user ? (
            <>
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
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={signOut}
                className="flex w-full items-center px-md py-[10px] text-left font-haas text-at-body-md text-at-ink outline-none transition-colors hover:bg-at-surface-soft focus:bg-at-surface-soft disabled:opacity-60"
              >
                {busy ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                role="menuitem"
                onClick={() => close()}
                className="flex items-center px-md py-[10px] font-haas text-at-body-md font-medium text-at-ink no-underline outline-none transition-colors hover:bg-at-surface-soft focus:bg-at-surface-soft"
              >
                Sign in
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={continueWithGoogle}
                className="flex w-full items-center gap-xs px-md py-[10px] text-left font-haas text-at-body-md text-at-body outline-none transition-colors hover:bg-at-surface-soft focus:bg-at-surface-soft disabled:opacity-60"
              >
                <GoogleGlyph />
                {busy ? "Redirecting…" : "Continue with Google"}
              </button>
              <p className="px-md py-xs font-haas text-at-caption text-at-muted">
                New here? Continuing with Google creates your account.
              </p>
            </>
          )}
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
          aria-label="Game categories"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas py-[6px] shadow-at-card-hover"
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
              className={`flex items-center justify-between px-md py-[10px] font-haas text-at-body-md no-underline outline-none transition-colors hover:bg-at-surface-soft hover:text-at-link focus:bg-at-surface-soft focus:text-at-link ${
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
