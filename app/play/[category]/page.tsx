import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllQuizIds, getQuizById } from "@/lib/quizzes";
import { isProGameId } from "@/data/catalog";
import { hasActiveSubscription } from "@/lib/subscription/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GameClient } from "@/components/GameClient";

type PageProps = {
  params: Promise<{ category: string }>;
};

/** Statically generate one page per quiz for SEO + fast loads. */
export function generateStaticParams() {
  return getAllQuizIds().map((category) => ({ category }));
}

// This page reads the auth session (for the answer-reveal gate + Pro gate),
// so it must render per-request rather than being cached statically.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const quiz = getQuizById(category);
  if (!quiz) {
    return { title: "Quiz not found" };
  }
  const description = `Play "${quiz.title}" — a pass-and-play party quiz. Take turns guessing this Top ${quiz.listLength} ranked list; guessing #1 is worth ${quiz.listLength} points. Source: ${quiz.source}.`;
  return {
    title: quiz.title,
    description,
    alternates: { canonical: `/play/${quiz.id}` },
    openGraph: {
      title: `${quiz.title} — Qwardoo`,
      description,
      type: "website",
    },
  };
}

export default async function PlayPage({ params }: PageProps) {
  const { category } = await params;
  const quiz = getQuizById(category);

  if (!quiz) {
    notFound();
  }

  // Server-side Pro gate: Pro games require an active subscription. Enforced
  // here so it can't be bypassed by navigating straight to the URL.
  if (isProGameId(category) && !(await hasActiveSubscription())) {
    redirect("/subscribe?from=pro");
  }

  // Whether the player is signed in (controls the answer-reveal gate).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <GameClient quiz={quiz} isSignedIn={Boolean(user)} />;
}
