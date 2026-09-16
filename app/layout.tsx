import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qwardoo.example.com"),
  title: {
    default: "Qwardoo — The Pass-and-Play Party Quiz",
    template: "%s — Qwardoo",
  },
  description:
    "A local, pass-and-play party trivia game. Guess entries on a ranked list. The closer your correct guess is to #1, the more points you score.",
  openGraph: {
    title: "Qwardoo — The Pass-and-Play Party Quiz",
    description:
      "Take turns guessing entries on a ranked list. Closer to #1 means more points. 1–7 players, one device.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Slow animated ambient gradient, behind everything. */}
        <div aria-hidden className="ambient-bg" />
        {children}
      </body>
    </html>
  );
}
