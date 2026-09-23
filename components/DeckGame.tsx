"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Deck, TwoOptionCard, TruthOrDareCard } from "@/lib/deckTypes";
import {
  isTwoOptionCard,
  isTruthOrDareCard,
} from "@/lib/deckTypes";
import { shuffle, pickByKind } from "@/lib/deckEngine";

/**
 * Pass-and-play prompt-deck game. Renders one card at a time and flips through
 * the shuffled deck. Three modes, driven by deck.type:
 *  - two-option: A vs B card (Would You Rather / This or That)
 *  - statement: one prompt (Never Have I Ever)
 *  - truth-or-dare: pick Truth or Dare, then show a random card of that kind
 * No scoring — you just play for laughs and tap Next.
 */
export function DeckGame({ deck }: { deck: Deck }) {
  const [seed, setSeed] = useState(1);

  if (deck.type === "truth-or-dare") {
    return <TruthOrDareGame deck={deck} seed={seed} onReshuffle={() => setSeed((s) => s + 1)} />;
  }
  return <LinearDeck deck={deck} seed={seed} onReshuffle={() => setSeed((s) => s + 1)} />;
}

/** Shared page shell: header + a centered card area + footer controls. */
function DeckShell({
  deck,
  progress,
  children,
  footer,
}: {
  deck: Deck;
  progress?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-content flex-col px-lg py-xl">
      <div className="mb-lg flex items-center justify-between">
        <div>
          <p className="text-caption capitalize text-ink-muted-48">
            {deck.category}
          </p>
          <h1 className="text-display-md font-semibold tracking-tight text-ink">
            {deck.title}
          </h1>
        </div>
        <Link
          href="/"
          className="text-caption text-primary transition-colors duration-fast ease-soft hover:text-primary-focus"
        >
          Exit
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-lg">
        {children}
      </div>

      <div className="mt-lg flex items-center justify-between">
        <span className="text-caption text-ink-muted-48">{progress ?? ""}</span>
        {footer}
      </div>
    </div>
  );
}

/** Linear flip-through for two-option + statement decks. */
function LinearDeck({
  deck,
  seed,
  onReshuffle,
}: {
  deck: Deck;
  seed: number;
  onReshuffle: () => void;
}) {
  const order = useMemo(
    () => shuffle(deck.cards.map((_, i) => i), seed),
    [deck.cards, seed]
  );
  const [pos, setPos] = useState(0);

  const done = pos >= order.length;
  const card = done ? null : deck.cards[order[pos]];

  function next() {
    setPos((p) => p + 1);
  }
  function restart() {
    onReshuffle();
    setPos(0);
  }

  if (done) {
    return (
      <DeckShell deck={deck} footer={null}>
        <div className="motion-pop rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
          <p className="text-display-md font-semibold text-ink">
            That&apos;s the whole deck!
          </p>
          <p className="mt-sm text-body-apple text-ink-muted-80">
            You went through all {deck.cards.length} cards.
          </p>
          <div className="mt-lg flex flex-col items-center gap-sm sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={restart}
              className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill bg-primary px-lg text-body-apple text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
            >
              Shuffle &amp; play again
            </button>
            <Link
              href="/"
              className="press-scale focus-ring inline-flex h-[44px] items-center justify-center rounded-pill border border-primary px-lg text-body-apple text-primary no-underline transition-all duration-base ease-soft hover:-translate-y-[1px] active:translate-y-0"
            >
              Back to games
            </Link>
          </div>
        </div>
      </DeckShell>
    );
  }

  return (
    <DeckShell
      deck={deck}
      progress={`Card ${pos + 1} of ${order.length}`}
      footer={
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={restart}
            className="focus-ring rounded-pill px-md py-[8px] text-caption text-ink-muted-48 transition-colors duration-fast ease-soft hover:text-ink"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={next}
            className="press-scale focus-ring inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
          >
            Next
          </button>
        </div>
      }
    >
      {card && isTwoOptionCard(card) ? (
        <TwoOptionCardView key={pos} card={card} />
      ) : (
        <StatementCardView key={pos} text={(card as { text: string }).text} />
      )}
    </DeckShell>
  );
}

function TwoOptionCardView({ card }: { card: TwoOptionCard }) {
  return (
    <div className="motion-fade flex w-full flex-col items-stretch gap-md sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center justify-center rounded-lg bg-at-coral p-xl text-center shadow-at-card">
        <p className="text-lead font-semibold text-white">{card.a}</p>
      </div>
      <div className="flex items-center justify-center py-xs">
        <span className="rounded-full bg-pearl px-md py-xs text-caption-strong font-semibold uppercase tracking-wide text-ink-muted-80">
          or
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg bg-at-forest p-xl text-center shadow-at-card">
        <p className="text-lead font-semibold text-white">{card.b}</p>
      </div>
    </div>
  );
}

function StatementCardView({ text }: { text: string }) {
  return (
    <div className="motion-pop flex min-h-[220px] w-full items-center justify-center rounded-lg border border-divider-soft bg-canvas p-section text-center shadow-at-card">
      <p className="text-lead font-semibold text-ink">{text}</p>
    </div>
  );
}

/** Truth or Dare: pick a kind, then reveal a random card of that kind. */
function TruthOrDareGame({
  deck,
  seed,
  onReshuffle,
}: {
  deck: Deck;
  seed: number;
  onReshuffle: () => void;
}) {
  // step: "pick" (choose truth/dare) or "reveal" (showing a card)
  const [step, setStep] = useState<"pick" | "reveal">("pick");
  const [shownIndex, setShownIndex] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  function choose(kind: "truth" | "dare") {
    const idx = pickByKind(deck.cards, kind, seed + round * 31, shownIndex);
    setShownIndex(idx);
    setStep("reveal");
    setRound((r) => r + 1);
  }

  function backToPick() {
    setStep("pick");
  }

  const card =
    shownIndex !== null ? (deck.cards[shownIndex] as TruthOrDareCard) : null;

  if (step === "pick") {
    return (
      <DeckShell deck={deck} footer={null}>
        <p className="text-body-apple text-ink-muted-80">
          Whose turn is it? Choose one:
        </p>
        <div className="flex w-full flex-col gap-md sm:flex-row">
          <button
            type="button"
            onClick={() => choose("truth")}
            className="press-scale focus-ring flex flex-1 items-center justify-center rounded-lg bg-at-forest p-section text-center shadow-at-card transition-all duration-base ease-soft hover:-translate-y-[2px] hover:shadow-at-card-hover"
          >
            <span className="text-display-md font-semibold text-white">Truth</span>
          </button>
          <button
            type="button"
            onClick={() => choose("dare")}
            className="press-scale focus-ring flex flex-1 items-center justify-center rounded-lg bg-at-coral p-section text-center shadow-at-card transition-all duration-base ease-soft hover:-translate-y-[2px] hover:shadow-at-card-hover"
          >
            <span className="text-display-md font-semibold text-white">Dare</span>
          </button>
        </div>
      </DeckShell>
    );
  }

  return (
    <DeckShell
      deck={deck}
      footer={
        <button
          type="button"
          onClick={backToPick}
          className="press-scale focus-ring inline-flex h-[48px] items-center justify-center rounded-pill bg-primary px-xl text-button-large text-white transition-all duration-base ease-soft hover:-translate-y-[1px] hover:bg-primary-focus hover:shadow-at-card-hover active:translate-y-0"
        >
          Next player
        </button>
      }
    >
      {card && (
        <div
          key={round}
          className={`motion-pop flex min-h-[220px] w-full flex-col items-center justify-center rounded-lg p-section text-center shadow-at-card ${
            card.kind === "dare" ? "bg-at-coral" : "bg-at-forest"
          }`}
        >
          <span className="mb-sm rounded-full bg-white/20 px-md py-xs text-caption-strong font-semibold uppercase tracking-wide text-white">
            {card.kind}
          </span>
          <p className="text-lead font-semibold text-white">{card.text}</p>
        </div>
      )}
    </DeckShell>
  );
}
