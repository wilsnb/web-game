"use client";

import { useState } from "react";

const CONFIRM_WORD = "DELETE";

/**
 * "Danger zone" — permanently delete the account. Requires typing DELETE to
 * confirm so it can't happen by accident. On success, redirects home (the
 * server already deleted the user + all their data and cleared the session).
 */
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirm.trim().toUpperCase() === CONFIRM_WORD;

  async function deleteAccount() {
    if (!canDelete || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/delete-account", { method: "POST" });
    if (res.ok) {
      // Hard navigation so all client state + the cleared session reset.
      window.location.assign("/");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not delete your account.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-lg rounded-at-md border border-at-coral/50 bg-at-coral/5 p-lg">
      <h2 className="font-haas text-at-title-lg font-normal text-at-coral">
        Danger zone
      </h2>
      <p className="mt-sm font-haas text-at-body-md text-at-body">
        Deleting your account is permanent. It removes your username, saved
        games, stats, ratings, subscription record, and any feedback — this
        can&apos;t be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-md inline-flex items-center justify-center rounded-at-lg border border-at-coral px-lg py-md font-haas text-at-button font-medium text-at-coral transition-all duration-base ease-soft hover:bg-at-coral hover:text-at-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-coral"
        >
          Delete account
        </button>
      ) : (
        <div className="motion-rise mt-md flex flex-col gap-sm">
          <label className="font-haas text-at-body-md text-at-ink">
            Type <span className="font-semibold">{CONFIRM_WORD}</span> to
            confirm
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="mt-xxs h-[44px] w-full max-w-[240px] rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink transition-all duration-base ease-soft focus:border-at-coral focus:outline-none focus:ring-2 focus:ring-at-coral/30"
            />
          </label>

          {error && (
            <p className="motion-fade font-haas text-at-body-md text-at-coral" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-sm">
            <button
              type="button"
              disabled={!canDelete || busy}
              onClick={deleteAccount}
              className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-coral px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft will-change-transform hover:opacity-90 hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-coral disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {busy ? "Deleting…" : "Permanently delete my account"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="inline-flex h-[44px] items-center justify-center rounded-at-lg border border-at-hairline bg-at-canvas px-lg font-haas text-at-button font-medium text-at-ink transition-all duration-base ease-soft hover:border-at-border-strong hover:shadow-at-card disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
