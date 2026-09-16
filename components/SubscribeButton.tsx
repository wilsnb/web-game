"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Minimal shape of the Midtrans Snap global injected by snap.js.
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const SNAP_SRC_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_SRC_PRODUCTION = "https://app.midtrans.com/snap/snap.js";

export function SubscribeButton({
  label = "Subscribe",
  isProduction = false,
}: {
  label?: string;
  isProduction?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapSrc = isProduction ? SNAP_SRC_PRODUCTION : SNAP_SRC_SANDBOX;

  async function startCheckout() {
    setLoading(true);
    setMessage(null);

    // 1. Ask our server for a Snap token (server uses the secret key).
    const res = await fetch("/api/create-transaction", { method: "POST" });

    if (res.status === 401) {
      // Not signed in — send to login, then back here.
      router.push("/login?next=/subscribe");
      return;
    }
    if (!res.ok) {
      setLoading(false);
      setMessage("Couldn't start checkout. Please try again.");
      return;
    }

    const { token } = (await res.json()) as { token: string };

    if (!window.snap) {
      setLoading(false);
      setMessage("Payment library still loading — try again in a moment.");
      return;
    }

    // 2. Open the Midtrans payment popup.
    window.snap.pay(token, {
      onSuccess: () => {
        // Payment captured. The webhook activates the subscription; refresh so
        // the page reflects the new status once the webhook lands.
        setMessage("Payment received! Activating your subscription…");
        setTimeout(() => router.refresh(), 1500);
      },
      onPending: () => {
        setMessage("Payment pending. We'll activate once it clears.");
        setLoading(false);
      },
      onError: () => {
        setMessage("Payment failed. Please try again.");
        setLoading(false);
      },
      onClose: () => {
        setLoading(false);
        setMessage("Checkout closed before finishing.");
      },
    });
  }

  return (
    <>
      <Script src={snapSrc} data-client-key={clientKey} strategy="afterInteractive" />
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-at-lg bg-at-primary px-lg py-md font-haas text-at-button font-medium text-at-on-dark no-underline transition-colors hover:bg-at-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-at-link disabled:opacity-60"
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {message && (
        <p className="mt-sm font-haas text-at-body-md text-at-body" role="status">
          {message}
        </p>
      )}
    </>
  );
}
