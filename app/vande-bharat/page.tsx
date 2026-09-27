import { Metadata } from "next";
import { Suspense } from "react";
import VandeBharatClient from "./VandeBharatClient";

export const metadata: Metadata = {
  title:
    "Pan-India Vande Bharat & Vande Sleeper Explorer | Live Erail Fares & Routes | Wayvia",
  description:
    "Explore all Vande Bharat Express routes across India with live erail.in network schedules, intermediate halts, live fare tables, time vs flight arbitrage calculator, catering opt-out savings, and 2026 Vande Sleeper blueprints.",
  keywords: [
    "vande bharat express routes",
    "vande bharat sleeper train",
    "vande bharat live fare erail",
    "vande bharat timetable 2026",
    "vande bharat meal opt out savings",
    "vande bharat vs flight comparison",
    "vande bharat vs rajdhani",
    "delhi varanasi vande bharat fare",
    "mumbai gandhinagar vande bharat",
  ],
  alternates: {
    canonical: "/vande-bharat",
  },
  openGraph: {
    title: "Pan-India Vande Bharat & Sleeper Explorer | Wayvia",
    description:
      "Comprehensive live guide to every Vande Bharat Express in India. Live erail halt schedules, fares, IRCTC meal opt-out savings, and Vande Sleeper specs.",
    url: "https://wayvia.xyz/vande-bharat",
    siteName: "Wayvia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wayvia Pan-India Vande Bharat Explorer",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pan-India Vande Bharat & Sleeper Explorer | Wayvia",
    description:
      "Live erail timetables, fare tables, IRCTC catering opt-out calculator, and 2026 Vande Bharat Sleeper comparison.",
    images: ["/og-image.png"],
  },
};

export default function VandeBharatPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wayvia Vande Bharat & Sleeper Explorer",
    url: "https://wayvia.xyz/vande-bharat",
    applicationCategory: "TravelApplication",
    operatingSystem: "All",
    description:
      "Interactive Pan-India Vande Bharat catalogue with live erail network halts, catering savings calculator, and sleeper comparisons.",
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
            Loading Vande Bharat Explorer…
          </div>
        }
      >
        <VandeBharatClient />
      </Suspense>
    </>
  );
}
