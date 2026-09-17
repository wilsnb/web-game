"use client";

import { useState } from "react";

export function ProfileVisibilityToggle({
  initialPublic,
}: {
  initialPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !isPublic;
    setIsPublic(next); // optimistic
    setSaving(true);
    const res = await fetch("/api/profile-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (!res.ok) setIsPublic(!next); // revert on failure
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-sm">
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-label="Make profile public"
        disabled={saving}
        onClick={toggle}
        className={`relative h-[30px] w-[52px] rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link ${
          isPublic ? "bg-at-primary" : "bg-at-surface-strong"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-at-canvas transition-all ${
            isPublic ? "left-[25px]" : "left-[3px]"
          }`}
        />
      </button>
      <span className="font-haas text-at-body-md text-at-ink">
        {isPublic ? "Public — shown on leaderboards" : "Private — hidden"}
      </span>
    </div>
  );
}
