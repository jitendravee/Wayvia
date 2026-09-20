import type { Metadata } from "next";
import { Suspense } from "react";
import JunctionsHubClient from "./JunctionsHubClient";

export const metadata: Metadata = {
  title:
    "Major Railway Junction Hubs — Transfer Guides, Cloakrooms & Lounges | Wayvia",
  description:
    "Complete layover and transfer guides for Indian Railway junction stations. Minimum connection times, inter-station Metro/cab transfers, cloakroom locations, and executive lounges.",
  keywords: [
    "railway junction guide",
    "station transfer guide",
    "irctc cloakroom rules",
    "railway executive lounge",
    "delhi station transfer ndls nzm",
    "howrah to sealdah transfer",
    "connecting train layover safety",
  ],
  alternates: {
    canonical: "/junctions",
  },
  openGraph: {
    title: "Major Railway Junction Hubs & Transfer Guides | Wayvia",
    description:
      "Layover survival guides, minimum connection times, and inter-station transfers across India's top railway junctions.",
    url: "https://wayvia.xyz/junctions",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Major Railway Junction Hubs & Transfer Guides | Wayvia",
    description:
      "Layover survival guides, minimum connection times, and inter-station transfers across India's top railway junctions.",
  },
};

export default function JunctionsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Indian Railway Junction Hubs & Transfer Guides",
    url: "https://wayvia.xyz/junctions",
    description:
      "Comprehensive layover guides, inter-station Metro transit routes, and station amenity rules for Indian Railways.",
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
              Loading Junction Hub Guides...
            </div>
          }
        >
          <JunctionsHubClient />
        </Suspense>
      </div>
    </>
  );
}
