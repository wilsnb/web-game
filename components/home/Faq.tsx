"use client";

import { useId, useState } from "react";

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "Do I need to create an account to play?",
    a: "No — every game is playable as a guest. Signing in with Google is optional, but it unlocks the extras: your scores and stats are saved, you earn badge levels as you rack up points, you appear on the leaderboards, and you get to see the real top-20 answers revealed after each game.",
  },
  {
    q: "Is it free to play?",
    a: "Most games are completely free — no ads, no catch. A few games are marked Premium and need a Qwardoo Pro subscription to play, but everything else stays free for everyone.",
  },
  {
    q: "How many players can play together?",
    a: "Games are pass-and-play on one shared device, for 1 to 7 players. You take turns on the same screen — there are no separate rooms or codes.",
  },
  {
    q: "Do I need to download anything?",
    a: "No. It runs entirely in your web browser on your phone, tablet, or computer. There's nothing to install.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-content px-md py-section sm:px-lg">
      <h2 className="mb-lg font-haas text-at-display-md font-normal text-at-ink">
        Frequently asked questions
      </h2>
      <ul className="flex flex-col gap-sm">
        {FAQS.map((item) => (
          <li key={item.q}>
            <FaqItem item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FaqItem({ item }: { item: QA }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="overflow-hidden rounded-at-md border border-at-hairline bg-at-canvas">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-md px-md py-md text-left font-haas text-at-title-sm font-medium text-at-ink transition-colors duration-fast ease-soft hover:bg-at-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link"
        >
          <span>{item.q}</span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className={`h-[16px] w-[16px] flex-none text-at-muted transition-transform duration-base ease-soft ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="motion-rise border-t border-at-hairline px-md py-md font-haas text-at-body-md leading-relaxed text-at-body"
        >
          {item.a}
        </div>
      )}
    </div>
  );
}
