import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { UsernamePicker } from "@/components/UsernamePicker";

export const metadata: Metadata = {
  title: "Choose your username",
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  // Already has a username? Skip onboarding.
  const profile = await getProfile();
  if (profile?.username) redirect(next || "/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-md py-xxl">
      <div className="w-full max-w-[420px] rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card sm:p-xl">
        <h1 className="font-haas text-at-display-md font-normal text-at-ink">
          Pick a username
        </h1>
        <p className="mt-xs font-haas text-at-body-md text-at-body">
          This is how you&apos;ll appear on leaderboards. You can play as usual
          once it&apos;s set.
        </p>
        <div className="mt-lg">
          <UsernamePicker next={next || "/"} />
        </div>
      </div>
    </div>
  );
}
