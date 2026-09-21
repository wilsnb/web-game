import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/delete-account — permanently deletes the signed-in user's account.
 *
 * Deleting the auth user requires the service-role admin client. Because all
 * app tables (profiles, game_results, subscriptions, game_ratings, feedback)
 * reference auth.users(id) with ON DELETE CASCADE, removing the auth user
 * automatically wipes all of their data — fulfilling the privacy policy.
 *
 * Auth-gated: a user can only delete THEIR OWN account (the id comes from the
 * verified session, never from the request body).
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("account deletion failed:", error);
    return NextResponse.json(
      { error: "Could not delete your account. Please try again." },
      { status: 500 }
    );
  }

  // Clear the local session too (best-effort; the user no longer exists).
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
