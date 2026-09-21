"use client";

import { useState } from "react";

const FEEDBACK_TYPES = [
  "Suggestion",
  "Bug Report",
  "Compliment",
  "Complaint",
  "Other",
];

const inputClass =
  "mt-xxs h-[44px] w-full rounded-at-sm border border-at-hairline bg-at-canvas px-md font-haas text-at-body-md text-at-ink placeholder:text-at-muted focus:border-at-link focus:outline-none focus:ring-2 focus:ring-at-link/30";
const labelClass = "block font-haas text-at-body-md text-at-ink";

/** Interactive 1–5 star rating. */
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="mt-xxs flex items-center gap-xxs" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link rounded-at-xs p-[2px]"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-[28px] w-[28px] ${
                active ? "text-at-yellow" : "text-at-hairline"
              }`}
              fill="currentColor"
            >
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function FeedbackForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState(FEEDBACK_TYPES[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please give a star rating.");
      return;
    }
    if (!message.trim()) {
      setError("Please tell us more.");
      return;
    }
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "feedback",
        name,
        email,
        rating,
        feedbackType,
        message,
      }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
      setRating(0);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not send. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-at-sm border border-at-hairline bg-at-surface-soft p-md font-haas text-at-body-md text-at-ink">
        Thanks for the feedback! 🙌{" "}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-at-link hover:text-at-link-active"
        >
          Send more
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

      <div>
        <span className={labelClass}>How was your experience?</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <label className={labelClass}>
        Feedback type
        <select
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value)}
          className={inputClass}
        >
          {FEEDBACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Tell us more
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="What did you like, or what could be better?"
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
        {status === "sending" ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}
