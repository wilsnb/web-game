import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllQuizIds, getQuizById } from "@/lib/quizzes";
import { getAllDeckIds, getDeckById } from "@/lib/decks";
import {
  getAllSoloGameIds,
  getSoloGameById,
  isSoloGameId,
} from "@/lib/soloGames";
import { isProGameId } from "@/data/catalog";
import { hasActiveSubscription } from "@/lib/subscription/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GameClient } from "@/components/GameClient";
import { DeckGame } from "@/components/DeckGame";
import { SoloGame } from "@/components/solo/SoloGame";

type PageProps = {
  params: Promise<{ category: string }>;
};

/** Statically generate one page per quiz, deck, and solo game. */
export function generateStaticParams() {
  return [
    ...getAllQuizIds(),
    ...getAllDeckIds(),
    ...getAllSoloGameIds(),
  ].map((category) => ({ category }));
}

// This page reads the auth session (for the answer-reveal gate + Pro gate),
// so it must render per-request rather than being cached statically.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const quiz = getQuizById(category);
  if (quiz) {
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

  const deck = getDeckById(category);
  if (deck) {
    return {
      title: deck.title,
      description: `${deck.title} — ${deck.description} A free pass-and-play party game on Qwardoo.`,
      alternates: { canonical: `/play/${deck.id}` },
      openGraph: {
        title: `${deck.title} — Qwardoo`,
        description: deck.description,
        type: "website",
      },
    };
  }

  const solo = getSoloGameById(category);
  if (solo) {
    return {
      title: solo.title,
      description: `${solo.title} — ${solo.description} A free solo game on Qwardoo.`,
      alternates: { canonical: `/play/${solo.id}` },
      openGraph: {
        title: `${solo.title} — Qwardoo`,
        description: solo.description,
        type: "website",
      },
    };
  }

  return { title: "Game not found" };
}

export default async function PlayPage({ params }: PageProps) {
  const { category } = await params;
  const quiz = getQuizById(category);

  // Prompt-deck party games + solo skill/brain games — free, no auth or Pro
  // gate. Handled before the quiz path.
  if (!quiz) {
    const deck = getDeckById(category);
    if (deck) {
      return <DeckGame deck={deck} />;
    }
    if (isSoloGameId(category)) {
      return <SoloGame id={category} />;
    }
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
