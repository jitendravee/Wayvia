import { Metadata } from "next";
import { Suspense } from "react";
import JourneyCardClient from "./JourneyCardClient";

export const metadata: Metadata = {
  title: "1-Click WhatsApp Train Journey Passport & PNR Card | Wayvia",
  description:
    "Generate an aesthetic digital Live Journey Passport from your IRCTC PNR. 1-click WhatsApp family group share, confirmation odds, coach platform position, and downloadable card image.",
  keywords: [
    "whatsapp train journey card",
    "pnr status share on whatsapp",
    "train boarding pass generator",
    "irctc pnr card image",
    "train status whatsapp message",
    "coach position whatsapp share",
    "pnr confirmation prediction share",
  ],
  alternates: {
    canonical: "/journey-card",
  },
  openGraph: {
    title: "1-Click WhatsApp Live Journey Passport | Wayvia",
    description:
      "Turn your IRCTC PNR into an aesthetic digital boarding pass. Share with family on WhatsApp with 1 click, showing live confirmation odds and platform coach location.",
    url: "https://wayvia.xyz/journey-card",
    siteName: "Wayvia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wayvia Live Journey Passport",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "1-Click WhatsApp Train Journey Passport | Wayvia",
    description:
      "Turn your IRCTC PNR into an aesthetic digital boarding pass. 1-click WhatsApp share with confirmation odds & coach position.",
    images: ["/og-image.png"],
  },
};

export default function JourneyCardPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Live Journey Passport",
    url: "https://wayvia.xyz/journey-card",
    applicationCategory: "TravelApplication",
    operatingSystem: "All",
    description:
      "Aesthetic digital boarding pass generator and 1-click WhatsApp family group sharing tool for Indian Railways passengers.",
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
          <div className="min-h-screen py-24 text-center text-ink-muted">
            Loading journey card…
          </div>
        }
      >
        <JourneyCardClient />
      </Suspense>
    </>
  );
}
