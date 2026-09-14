"use client";

import { useEffect, useState } from "react";

/**
 * Renders today's date on the client to avoid a static-build/runtime mismatch.
 * (A statically generated page would otherwise freeze the build date.)
 */
export function CurrentDate() {
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <time className="font-haas text-at-body-md text-at-muted" suppressHydrationWarning>
      {today || "\u00A0"}
    </time>
  );
}
