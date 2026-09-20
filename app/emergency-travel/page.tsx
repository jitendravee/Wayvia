import type { Metadata } from "next";
import { Suspense } from "react";
import EmergencyClient from "./EmergencyClient";

export const metadata: Metadata = {
  title:
    "Emergency & Festival Sold-Out Travel Rescue Portal — Guaranteed Seats | Wayvia",
  description:
    "Diwali, Chhath Puja, or family emergency showing REGRET or WL 200+? Wayvia synthesizes guaranteed multimodal routes, unlocking hidden General Quota seats and connecting sleeper buses.",
  keywords: [
    "emergency train ticket",
    "diwali train tickets sold out",
    "chhath puja confirmed train tickets",
    "alternate train route bihar",
    "delhi to patna emergency travel",
    "sold out train alternative route",
    "guaranteed reach travel india",
  ],
  alternates: {
    canonical: "/emergency-travel",
  },
  openGraph: {
    title: "Emergency & Festival Sold-Out Travel Rescue Portal | Wayvia",
    description:
      "When every direct train is sold out: Guaranteed Reach Score, General Quota shifts, and connecting high-speed routes.",
    url: "https://wayvia.xyz/emergency-travel",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emergency & Festival Sold-Out Travel Rescue Portal | Wayvia",
    description:
      "When every direct train is sold out: Guaranteed Reach Score and connecting multimodal routes.",
  },
};

export default function EmergencyTravelPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Emergency & Festival Sold-Out Travel Rescue Portal",
    url: "https://wayvia.xyz/emergency-travel",
    description:
      "Algorithmic rescue engine finding guaranteed confirmed seats across rail and road during peak Indian festival seasons.",
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
              Loading Emergency Travel Rescue Portal...
            </div>
          }
        >
          <EmergencyClient />
        </Suspense>
      </div>
    </>
  );
}
