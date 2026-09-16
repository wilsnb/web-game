import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLAN } from "@/lib/subscription/plan";

/**
 * Midtrans Payment Notification (webhook). Midtrans POSTs here on every
 * payment status change. We:
 *   1. Verify the signature so we only trust genuine Midtrans calls.
 *   2. Map the payment status to our subscription status.
 *   3. Upsert the user's row in the Supabase `subscriptions` table.
 *
 * Set this URL in Midtrans dashboard → Settings → Configuration →
 * Payment Notification URL:  https://<your-domain>/api/midtrans-webhook
 */
export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = body;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. Verify signature: sha512(order_id + status_code + gross_amount + serverKey)
  const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
  const expected = createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  if (expected !== signature_key) {
    console.warn("Midtrans webhook: invalid signature for order", order_id);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // 2. Map Midtrans status -> our subscription status.
  //    Success = settlement, or capture with an accepted fraud check.
  const isPaid =
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept");

  let status: "active" | "pending" | "canceled";
  if (isPaid) status = "active";
  else if (
    transaction_status === "pending" ||
    transaction_status === "authorize"
  )
    status = "pending";
  else status = "canceled"; // deny, cancel, expire, failure, refund, chargeback

  // Order id format: sub_<userId>_<random>
  const match = order_id.match(/^sub_(.+)_[^_]+$/);
  const userId = match?.[1];
  if (!userId) {
    // Not one of our subscription orders — acknowledge so Midtrans stops retrying.
    return NextResponse.json({ received: true });
  }

  // 3. Upsert the subscription row (service-role client bypasses RLS).
  const admin = createSupabaseAdminClient();

  const now = new Date();
  const currentPeriodEnd =
    status === "active"
      ? new Date(now.getTime() + PLAN.periodDays * 24 * 60 * 60 * 1000)
      : null;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: PLAN.id,
      status,
      order_id,
      ...(currentPeriodEnd
        ? { current_period_end: currentPeriodEnd.toISOString() }
        : {}),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Supabase upsert failed in webhook:", error);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
