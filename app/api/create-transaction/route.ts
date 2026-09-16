import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSnapClient } from "@/lib/midtrans/server";
import { PLAN } from "@/lib/subscription/plan";

/**
 * Creates a Midtrans Snap transaction for the Ranked Pro subscription and
 * returns a Snap token the browser uses to open the payment popup.
 *
 * Runs server-side only (uses the secret server key). Requires a signed-in
 * user so the resulting payment can be tied to their account via order_id.
 */
export async function POST() {
  // Must be signed in to subscribe (payment is tied to the account).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to subscribe." },
      { status: 401 }
    );
  }

  // Order id encodes the user + plan so the webhook can map payment -> account.
  // Format: sub_<userId>_<random>. We parse the userId back out in the webhook.
  const orderId = `sub_${user.id}_${randomUUID().slice(0, 8)}`;

  const snap = getSnapClient();

  try {
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: PLAN.priceIdr,
      },
      item_details: [
        {
          id: PLAN.id,
          name: PLAN.name,
          price: PLAN.priceIdr,
          quantity: 1,
        },
      ],
      customer_details: {
        email: user.email,
        first_name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "Player",
      },
      // Ties Midtrans record to our metadata for reconciliation.
      metadata: { userId: user.id, planId: PLAN.id },
    });

    return NextResponse.json({ token: transaction.token, orderId });
  } catch (err) {
    console.error("Midtrans createTransaction failed:", err);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 500 }
    );
  }
}
