import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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

const SITE_URL = "https://wayvia.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayvia — Live Train Running Status & PNR Status",
    template: "%s | Wayvia",
  },
  description:
    "Wayvia gives you live Indian Railways train running status and PNR status. Search any train by number or name to see its current location, delay, next stop, and full station-wise schedule — plus instant PNR confirmation checks with a visual seat map.",
  keywords: [
    "train running status",
    "live train status",
    "PNR status",
    "PNR check",
    "spot your train",
    "Indian railway running status",
    "train current location",
    "train delay status",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Wayvia",
    title: "Wayvia — Live Train Running Status & PNR Status",
    description:
      "See exactly where your train is, how delayed it is, and what's next — plus instant PNR confirmation checks with a visual seat map.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayvia — Live Train Running Status & PNR Status",
    description:
      "See exactly where your train is, right now — plus instant PNR confirmation checks.",
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
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}