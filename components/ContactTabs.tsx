"use client";

import { useState } from "react";
import { ContactUsForm } from "./ContactUsForm";
import { FeedbackForm } from "./FeedbackForm";

type Tab = "contact" | "feedback";

export function ContactTabs({
  initialTab = "contact",
  defaultName,
  defaultEmail,
}: {
  initialTab?: Tab;
  defaultName: string;
  defaultEmail: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: "contact", label: "Contact Us" },
    { key: "feedback", label: "Give Feedback" },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Contact or feedback"
        className="mb-lg flex gap-xs rounded-at-md border border-at-hairline bg-at-surface-soft p-[4px]"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-at-sm px-md py-sm font-haas text-at-body-md font-medium transition-all duration-base ease-soft ${
                active
                  ? "bg-at-canvas text-at-ink shadow-at-card"
                  : "text-at-muted hover:text-at-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Active form */}
      <div className="rounded-at-md border border-at-hairline bg-at-canvas p-lg shadow-at-card sm:p-xl">
        {tab === "contact" ? (
          <>
            <h1 className="font-haas text-at-title-lg font-normal text-at-ink">
              Contact Us
            </h1>
            <p className="mt-xxs mb-lg font-haas text-at-body-md text-at-muted">
              Have a question or want to get in touch? Send us a message.
            </p>
            <ContactUsForm
              defaultName={defaultName}
              defaultEmail={defaultEmail}
            />
          </>
        ) : (
          <>
            <h1 className="font-haas text-at-title-lg font-normal text-at-ink">
              Share Your Feedback
            </h1>
            <p className="mt-xxs mb-lg font-haas text-at-body-md text-at-muted">
              Help us improve by telling us what you think.
            </p>
            <FeedbackForm
              defaultName={defaultName}
              defaultEmail={defaultEmail}
            />
          </>
        )}
      </div>
    </div>
  );
}
