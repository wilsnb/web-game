import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/profile";

/**
 * GET /api/username?u=name  — check availability (live UX check).
 * POST /api/username { username } — claim/set the current user's username.
 *
 * DB-level uniqueness (a unique index on lower(username)) is the real
 * guarantee; these checks are for UX and validation.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const u = (searchParams.get("u") ?? "").trim();

  const valid = validateUsername(u);
  if (!valid.ok) {
    return NextResponse.json({ available: false, error: valid.error });
  }

  const supabase = await createSupabaseServerClient();
  // Case-insensitive existence check.
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", u)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, error: "Check failed." });
  }
  return NextResponse.json({ available: !data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const valid = validateUsername(username);
  if (!valid.ok) {
    return NextResponse.json({ error: valid.error }, { status: 400 });
  }

  // Upsert the profile row. The unique index on lower(username) rejects
  // duplicates (race-safe) — we surface that as a friendly error.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    // 23505 = unique_violation (username taken).
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
    console.error("set username failed:", error);
    return NextResponse.json({ error: "Could not save username." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username });
}
