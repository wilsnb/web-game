/**
 * Pure username validation — safe to import from both client and server
 * (no server-only dependencies).
 *
 * Rules: 3–20 chars, letters/numbers/underscore.
 */
export function validateUsername(raw: string): {
  ok: boolean;
  error?: string;
} {
  const u = raw.trim();
  if (u.length < 3) return { ok: false, error: "Must be at least 3 characters." };
  if (u.length > 20) return { ok: false, error: "Must be 20 characters or fewer." };
  if (!/^[A-Za-z0-9_]+$/.test(u))
    return { ok: false, error: "Only letters, numbers, and underscores." };
  return { ok: true };
}
