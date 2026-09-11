import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { QueryClientProviderWrapper } from "./query-client-provider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wayvia.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayvia — Smart Train Journey Planner & Alternative Routes",
    template: "%s | Wayvia",
  },
  description:
    "Find confirmed train seats, connecting routes via junction hubs, and bus alternatives when direct trains are waitlisted. Live Indian Railways running status and PNR confirmation checks with visual seat maps.",
  keywords: [
    "train journey planner",
    "waitlist ticket alternative routes",
    "connecting trains india",
    "confirmed train ticket options",
    "train running status",
    "live train status",
    "PNR status",
    "PNR check",
    "train seat availability",
    "spot your train",
    "Indian railway running status",
    "train current location",
    "train delay status",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Wayvia",
    title: "Wayvia — Smart Train Journey Planner & Alternative Routes",
    description:
      "Find confirmed train seats and connecting routes when direct trains are full. Plus live train running status and instant PNR checks with seat layouts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayvia — Smart Train Journey Planner & Alternative Routes",
    description:
      "Discover smarter train routes, connecting junctions, and bus alternatives when direct trains are full.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Wayvia",
        url: SITE_URL,
        description:
          "Wayvia gives you live Indian Railways train running status and PNR status, with a station-by-station journey tracker and visual seat maps.",
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
            urlTemplate: `${SITE_URL}/running-status/{train}`,
          },
          "query-input": "required name=train",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>

      <body className="flex min-h-screen flex-col  antialiased">
        <QueryClientProviderWrapper>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
