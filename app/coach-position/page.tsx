import type { Metadata } from "next";
import { Suspense } from "react";
import CoachPositionClient from "./CoachPositionClient";

export const metadata: Metadata = {
  title:
    "Train Coach Position & 2D Seat Map Explorer — All Trains & Classes | Wayvia",
  description:
    "Interactive 22-coach train rake explorer and 2D seat map for Indian Railways. See where your coach stops on the platform (engine side, escalator, or rear) and find Lower, Middle, Upper, and Window berths.",
  keywords: [
    "train coach position",
    "irctc seat map",
    "berth layout 3a",
    "sleeper coach seat map",
    "where is coach b4",
    "train rake position",
    "coach position indian railways",
    "2a coach layout",
    "vande bharat seat map",
  ],
  alternates: {
    canonical: "/coach-position",
  },
  openGraph: {
    title: "Train Coach Position & 2D Seat Map Explorer | Wayvia",
    description:
      "Find your coach position on the platform and explore interactive 2D berth layouts for Sleeper, 3A, 2A, 1A, 3E, and Chair Car.",
    url: "https://wayvia.xyz/coach-position",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Train Coach Position & 2D Seat Map Explorer | Wayvia",
    description:
      "Interactive 22-coach train rake explorer and 2D seat map for Indian Railways.",
  },
};

export default function CoachPositionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Train Coach Position & 2D Seat Map Explorer",
    url: "https://wayvia.xyz/coach-position",
    description:
      "Interactive 22-coach train rake position finder and 2D architectural berth maps for Indian Railways.",
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
              Loading Coach Position &amp; Seat Map Explorer...
            </div>
          }
        >
          <CoachPositionClient />
        </Suspense>
      </div>
    </>
  );
}
