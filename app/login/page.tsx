import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Ranked to save your games and scores.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  // Already signed in? Skip the login page.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next || "/");

  return (
    <div className="flex min-h-screen flex-col bg-at-surface-soft">
      {/* Minimal top bar */}
      <div className="w-full border-b border-at-hairline bg-at-canvas">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center px-md sm:px-lg">
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
        </div>
      </div>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-md py-xxl">
        <div className="w-full max-w-[420px] rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card sm:p-xl">
          <h1 className="font-haas text-at-display-md font-normal text-at-ink">
            Sign in
          </h1>
          <p className="mt-xs font-haas text-at-body-md text-at-body">
            Sign in to save your games and scores. It&apos;s optional — you can
            still play as a guest.
          </p>

          {error === "auth" && (
            <p
              role="alert"
              className="mt-md rounded-at-sm border border-at-coral/40 bg-at-coral/5 px-md py-sm font-haas text-at-body-md text-at-coral"
            >
              Something went wrong signing you in. Please try again.
            </p>
          )}

          <div className="mt-lg">
            <GoogleSignInButton next={next || "/"} />
          </div>

          <div className="mt-lg border-t border-at-hairline pt-md">
            <Link
              href="/"
              className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
            >
              ← Back to quizzes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
