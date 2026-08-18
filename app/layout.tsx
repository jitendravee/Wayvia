import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const SITE_URL = "https://wayvia.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayvia — Find the smartest way to get there",
    template: "%s | Wayvia",
  },
  description:
    "Wayvia is a journey discovery platform. Tell us where you want to go and we search direct and connecting routes, check live seat availability, and rank every option by price, speed, and reliability. Starting with trains, expanding to buses and flights.",
  keywords: [
    "train route planner",
    "alternative train routes",
    "connecting trains India",
    "cheapest way to travel by train",
    "fastest train route",
    "train availability checker",
    "journey planner India",
    "best train route between two cities",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Wayvia",
    title: "Wayvia — Find the smartest way to get there",
    description:
      "We don't just show you the direct train. We explore connecting routes through nearby junctions, check live availability, and find the best way to get you there.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayvia — Find the smartest way to get there",
    description: "Direct or connecting, we find the best way to get you there — ranked by price, time and reliability.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Wayvia",
        url: SITE_URL,
        description:
          "Wayvia is a smart journey discovery platform that finds the best way to get from A to B by exploring direct and connecting routes.",
        logo: `${SITE_URL}/favicon.ico`,
      },
      {
        "@type": "WebSite",
        name: "Wayvia",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/?from={from}&to={to}`,
          },
          "query-input": "required name=from,to",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white text-ink antialiased">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
