import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check PNR Status Live & Visual Berth Layout",
  description:
    "Check your 10-digit Indian Railways IRCTC PNR confirmation status in real time. View coach position, berth number, visual seat layout, and RAC / waitlist confirmation chances.",
  keywords: [
    "PNR status",
    "check PNR status",
    "live PNR status",
    "IRCTC PNR check",
    "railway PNR status",
    "PNR confirmation probability",
    "train seat map PNR",
    "berth allotment check",
  ],
  alternates: {
    canonical: "/pnr-status",
  },
  openGraph: {
    title: "Check PNR Status Live & Visual Berth Layout | Wayvia",
    description:
      "Instant IRCTC PNR confirmation check with visual coach layout, berth allocation, and live waiting list chances.",
  },
};

export default function PnrLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Wayvia PNR Status Checker",
      applicationCategory: "TravelApplication",
      operatingSystem: "All",
      url: "https://wayvia.xyz/pnr-status",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How to check PNR status online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your 10-digit PNR number on Wayvia's PNR status page to instantly see your booking confirmation status, coach number, berth allocation (Lower/Middle/Upper/Side Lower/Side Upper), and a visual seat map showing your exact position in the coach."
          }
        },
        {
          "@type": "Question",
          name: "What does WL, RAC, and CNF mean in PNR status?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CNF (Confirmed) means you have a guaranteed seat. RAC (Reservation Against Cancellation) means you share a berth and will get a full berth if someone cancels. WL (Waitlist) means you don't have a berth yet — your ticket will auto-upgrade to RAC or CNF as other passengers cancel."
          }
        },
        {
          "@type": "Question",
          name: "How long does PNR status take to update after booking?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PNR status is available within 2-3 minutes of booking through IRCTC. The status updates automatically as chart preparation begins (typically 4 hours before departure) and whenever cancellations promote waitlisted passengers."
          }
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
