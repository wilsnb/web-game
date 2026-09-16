import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Subscription {
  status: "active" | "pending" | "canceled";
  planId: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Read the current user's subscription from Supabase.
 * Returns null if signed out or no subscription row exists.
 *
 * A subscription counts as "currently active" only if status is "active" AND
 * current_period_end is in the future — use `isSubscriptionActive`.
 */
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plan_id, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.status,
    planId: data.plan_id,
    currentPeriodEnd: data.current_period_end,
  };
}

/** True when the subscription is active and not yet expired. */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub || sub.status !== "active") return false;
  if (!sub.currentPeriodEnd) return false;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}
