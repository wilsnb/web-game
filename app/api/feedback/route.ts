import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_MESSAGE = 2000;
const MAX_SHORT = 120;

const SUBJECTS = [
  "General Inquiry",
  "Bug Report",
  "Account & Login",
  "Billing & Subscription",
  "Partnership",
  "Other",
];
const FEEDBACK_TYPES = [
  "Suggestion",
  "Bug Report",
  "Compliment",
  "Complaint",
  "Other",
];

/**
 * POST /api/feedback — logged-in only. Handles two form shapes:
 *  - Contact:  { type:"contact",  name, email, subject, message }
 *  - Feedback: { type:"feedback", name, email, rating(1-5), feedbackType, message }
 *
 * name/email are prefilled from the account but editable, so we accept the
 * submitted values (and also always store the real account user_id + email
 * for traceability).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to send a message." },
      { status: 401 }
    );
  }

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = b.type;
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim();
  const message = String(b.message ?? "").trim();

  if (type !== "contact" && type !== "feedback") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!name || name.length > MAX_SHORT) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email || email.length > MAX_SHORT || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Message is required (max ${MAX_MESSAGE} chars).` },
      { status: 400 }
    );
  }

  // Base row.
  const row: Record<string, unknown> = {
    user_id: user.id,
    account_email: user.email ?? null, // always the real account email
    type,
    name,
    email, // the email the user typed (may differ from account)
    message,
    subject: null,
    rating: null,
    feedback_type: null,
  };

  if (type === "contact") {
    const subject = String(b.subject ?? "").trim();
    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }
    row.subject = subject;
  } else {
    const rating = Number(b.rating);
    const feedbackType = String(b.feedbackType ?? "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please give a star rating." },
        { status: 400 }
      );
    }
    if (!FEEDBACK_TYPES.includes(feedbackType)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }
    row.rating = rating;
    row.feedback_type = feedbackType;
  }

  const { error } = await supabase.from("feedback").insert(row);
  if (error) {
    console.error("feedback insert failed:", error);
    return NextResponse.json(
      { error: "Could not send. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
