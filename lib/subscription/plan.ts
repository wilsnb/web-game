/**
 * Subscription plan config. Amounts are in whole IDR rupiah (Midtrans uses no
 * decimals). Pay-per-period model: each successful payment extends the
 * subscription by `periodDays`.
 */
export const PLAN = {
  id: "ranked-pro-monthly",
  name: "Ranked Pro",
  description: "Ranked Pro — monthly subscription",
  priceIdr: 49000,
  periodDays: 30,
} as const;

/** Format an IDR integer as e.g. "Rp49.000". */
export function formatIdr(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
