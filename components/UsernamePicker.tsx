"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateUsername } from "@/lib/username";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

export function UsernamePicker({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounced live availability check.
  useEffect(() => {
    const u = username.trim();
    if (!u) {
      setStatus("idle");
      setMessage(null);
      return;
    }
    const valid = validateUsername(u);
    if (!valid.ok) {
      setStatus("invalid");
      setMessage(valid.error ?? null);
      return;
    }
    setStatus("checking");
    setMessage(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username?u=${encodeURIComponent(u)}`);
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setMessage(null);
        } else {
          setStatus("taken");
          setMessage(data.error ?? "That username is already taken.");
        }
      } catch {
        setStatus("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "available") return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      router.replace(next || "/");
      router.refresh();
    } else {
      setSaving(false);
      setStatus(res.status === 409 ? "taken" : "invalid");
      setMessage(data.error ?? "Could not save username.");
    }
  }

  const hint =
    status === "checking"
      ? "Checking…"
      : status === "available"
      ? "Available!"
      : message;
  const hintColor =
    status === "available"
      ? "text-at-success"
      : status === "taken" || status === "invalid"
      ? "text-at-coral"
      : "text-at-muted";

  return (
    <form onSubmit={submit} className="flex flex-col gap-sm">
      <label className="font-haas text-at-body-md text-at-ink">
        Choose a username
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          maxLength={20}
          placeholder="e.g. quizmaster_7"
          className="mt-xs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
        />
      </label>
      <p className={`min-h-[20px] font-haas text-at-caption ${hintColor}`}>
        {hint ?? "3–20 characters · letters, numbers, underscore"}
      </p>
      <button
        type="submit"
        disabled={status !== "available" || saving}
        className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft will-change-transform hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
