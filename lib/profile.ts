import { createSupabaseServerClient } from "./supabase/server";

export { validateUsername } from "./username";

export interface Profile {
  id: string;
  username: string;
  isPublic: boolean;
}

/** Read the current user's profile, or null if none / signed out. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, is_public")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, username: data.username, isPublic: data.is_public };
}

/** True if the signed-in user still needs to pick a username. */
export async function needsUsername(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false; // signed out — not our concern here
  const profile = await getProfile();
  return !profile?.username;
}
