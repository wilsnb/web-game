import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllQuizSummaries } from "@/lib/quizzes";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MultiplayerLanding } from "@/components/multiplayer/MultiplayerLanding";

export const metadata: Metadata = {
  title: "Play online with friends",
  description: "Host or join a multiplayer Qwardoo room and play together.",
  alternates: { canonical: "/multiplayer" },
};

export default async function MultiplayerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quizzes = getAllQuizSummaries().map((q) => ({
    id: q.id,
    title: q.title,
  }));

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-[560px] px-md py-section sm:px-lg">
        <p className="font-haas text-at-caption uppercase tracking-wide text-at-coral">
          Multiplayer · Beta
        </p>
        <h1 className="mt-xs font-haas text-at-display-md font-normal text-at-ink sm:text-at-display-lg">
          Play online with friends
        </h1>
        <p className="mt-sm mb-lg font-haas text-at-body-md text-at-body">
          Host a room and share the code, or join a friend&apos;s room. Everyone
          plays together in real time — separate devices, one game.
        </p>

        <MultiplayerLanding isSignedIn={Boolean(user)} quizzes={quizzes} />
      </section>

      <SiteFooter />
    </div>
  );
}
