import { createSupabaseServerClient } from "./supabase/server";
import type { NavUser } from "@/components/Navbar";

/**
 * Reads the current Supabase user (if any) and maps it to the minimal shape
 * the navbar needs. Returns null when signed out.
 */
export async function getNavUser(): Promise<NavUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "Player";

  return {
    email: user.email ?? "",
    name,
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
  };
}
