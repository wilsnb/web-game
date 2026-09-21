"use client";

import { useState } from "react";

const SUBJECTS = [
  "General Inquiry",
  "Bug Report",
  "Account & Login",
  "Billing & Subscription",
  "Partnership",
  "Other",
];

const inputClass =
  "mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30";
const labelClass = "block font-haas text-at-body-md text-at-ink";

export function ContactUsForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contact", name, email, subject, message }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not send. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-at-sm border border-at-hairline bg-at-surface-soft p-md font-haas text-at-body-md text-at-ink">
        Thanks — your message has been sent. 🎉{" "}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-at-link hover:text-at-link-active"
        >
          Send another
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-md">
      <label className={labelClass}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={120}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Subject
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="How can we help?"
          className="mt-xxs w-full rounded-at-sm border border-at-hairline bg-at-canvas p-md font-haas text-at-body-md text-at-ink placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30"
        />
      </label>

      {error && (
        <p className="font-haas text-at-body-md text-at-coral" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-[44px] items-center justify-center rounded-at-lg bg-at-primary px-lg font-haas text-at-button font-medium text-at-on-dark transition-all duration-base ease-soft will-change-transform hover:bg-at-primary-active hover:-translate-y-[1px] hover:shadow-at-card-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
