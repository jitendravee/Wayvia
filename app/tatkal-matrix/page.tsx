import type { Metadata } from "next";
import { Suspense } from "react";
import TatkalClient from "./TatkalClient";

export const metadata: Metadata = {
  title:
    "Tatkal Command Center & Live War Room — Quotas, Countdown & 1-Click Autofill | Wayvia",
  description:
    "Beat the IRCTC Tatkal rush. Live AC (10:00 AM) and Sleeper (11:00 AM) countdowns, train Tatkal quota & competition heatmap, 1-click passenger master string autofill generator, and failover alternatives.",
  keywords: [
    "tatkal booking time",
    "irctc tatkal opening time",
    "tatkal master list autofill",
    "tatkal quota checker",
    "tatkal competition index",
    "confirmtkt tatkal pre-fill",
    "tatkal booking tips irctc",
    "tatkal opening date calculator",
  ],
  alternates: {
    canonical: "/tatkal-matrix",
  },
  openGraph: {
    title: "Tatkal Command Center & Live War Room | Wayvia",
    description:
      "Beat the 10:00 AM and 11:00 AM IRCTC rush. Live quota competition matrix, 1-click autofill strings, and emergency failover routes.",
    url: "https://wayvia.xyz/tatkal-matrix",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tatkal Command Center & Live War Room | Wayvia",
    description:
      "Beat the IRCTC Tatkal rush. Live countdowns, passenger string autofill, and quota exhaustion predictions.",
  },
};

export default function TatkalMatrixPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Tatkal Command Center",
    url: "https://wayvia.xyz/tatkal-matrix",
    description:
      "Real-time Indian Railways Tatkal quota analysis, opening countdowns, and passenger master list generator.",
    applicationCategory: "TravelApplication",
    operatingSystem: "All",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mt-16 sm:mt-20">
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl p-12 text-center font-mono text-xs text-ink-muted">
              Loading Tatkal Command Center...
            </div>
          }
        >
          <TatkalClient />
        </Suspense>
      </div>
    </>
  );
}
