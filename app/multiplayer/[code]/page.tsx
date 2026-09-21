import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RoomView } from "@/components/multiplayer/RoomView";
import { normalizeCode } from "@/lib/multiplayer/room";

export const metadata: Metadata = {
  title: "Multiplayer room",
  robots: { index: false },
};

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const roomCode = normalizeCode(code);

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
          href="/multiplayer"
          className="font-haas text-at-body-md text-at-link hover:text-at-link-active"
        >
          ← Leave room
        </Link>
        <div className="mt-md">
          <RoomView code={roomCode} viewerId={user?.id ?? null} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
