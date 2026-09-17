import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Google (via Supabase) redirects here with a `code`, which we
 * exchange for a session that gets stored in cookies. Then we bounce the user
 * to `next` (defaults to the homepage).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // New (or username-less) users must pick a username first.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.username) {
          const nextParam =
            next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
          return NextResponse.redirect(`${origin}/onboarding${nextParam}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send them to the login page with an error flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
