import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RoomView } from "@/components/multiplayer/RoomView";
import { SoloRoomView } from "@/components/multiplayer/SoloRoomView";
import { normalizeCode } from "@/lib/multiplayer/room";
import { getQuizById } from "@/lib/quizzes";
import { isSoloGameId, getSoloGameById } from "@/lib/soloGames";

export const metadata: Metadata = {
  title: "Multiplayer room",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const roomCode = normalizeCode(code);

  // Look up the room's content id (quiz_id holds a quiz id or a solo game id).
  const admin = createSupabaseAdminClient();
  const { data: room } = await admin
    .from("rooms")
    .select("quiz_id")
    .eq("code", roomCode)
    .maybeSingle();
  if (!room) {
    notFound();
  }

  const soloGame = isSoloGameId(room.quiz_id)
    ? getSoloGameById(room.quiz_id)
    : undefined;
  const quiz = soloGame ? undefined : getQuizById(room.quiz_id);
  if (!soloGame && !quiz) {
    notFound();
  }

  // Viewer's auth id (null for guests) — used to detect the host.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-[560px] px-md py-section sm:px-lg">
        <Link
          href="/"
          className="font-haas text-at-body-md text-at-link transition-colors duration-fast ease-soft hover:text-at-link-active"
        >
          ← Leave room
        </Link>
        <div className="mt-md">
          {soloGame ? (
            <SoloRoomView
              code={roomCode}
              soloGameId={soloGame.id}
              viewerId={user?.id ?? null}
            />
          ) : (
            <RoomView code={roomCode} quiz={quiz!} viewerId={user?.id ?? null} />
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
