import { Metadata } from "next";
import { Suspense } from "react";
import FareArbitrageClient from "./FareArbitrageClient";

export const metadata: Metadata = {
  title:
    "Telescopic Fare Arbitrage & Secret Train Upgrades | Save ₹800+ on IRCTC | Wayvia",
  description:
    "Uncover hidden price inefficiencies on Indian Railways using live erail.in data. Secret AC upgrades (Tatkal SL vs 3E/3A), GNWL origin quota unlocking, dynamic pricing surge breakers, and catering opt-out calculators.",
  keywords: [
    "railway fare arbitrage",
    "secret ac train upgrade",
    "tatkal sleeper vs 3a upgrade",
    "gnwl origin shift hack",
    "irctc dynamic pricing surge breaker",
    "telescopic fare savings",
    "irctc catering opt out discount",
    "indian railway ticket price hack",
  ],
  alternates: {
    canonical: "/fare-arbitrage",
  },
  openGraph: {
    title: "Telescopic Fare Arbitrage & Secret Upgrade Engine | Wayvia",
    description:
      "Find hidden railway price inefficiencies. Secret ₹45 AC upgrades, GNWL quota unlocks, and dynamic surge breakers using live erail data.",
    url: "https://wayvia.xyz/fare-arbitrage",
    siteName: "Wayvia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wayvia Railway Fare Arbitrage Engine",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telescopic Fare Arbitrage & Secret Upgrade Engine | Wayvia",
    description:
      "Find hidden railway price inefficiencies. Secret ₹45 AC upgrades, GNWL quota unlocks, and dynamic surge breakers using live erail data.",
    images: ["/og-image.png"],
  },
};

export default function FareArbitragePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Telescopic Fare Arbitrage Engine",
    url: "https://wayvia.xyz/fare-arbitrage",
    applicationCategory: "TravelApplication",
    operatingSystem: "All",
    description:
      "Algorithmic railway ticketing tool discovering price inefficiencies, secret class upgrades, and dynamic pricing surge breakers on Indian Railways.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen py-24 text-center text-slate-500">
            Loading Fare Arbitrage Engine…
          </div>
        }
      >
        <FareArbitrageClient />
      </Suspense>
    </>
  );
}
