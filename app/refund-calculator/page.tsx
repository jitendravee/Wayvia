import { Metadata } from "next";
import { Suspense } from "react";
import RefundCalculatorClient from "./RefundCalculatorClient";

export const metadata: Metadata = {
  title:
    "IRCTC Train Ticket Refund Calculator | Indian Railways Cancellation Charges",
  description:
    "Calculate your exact IRCTC train ticket cancellation refund. View itemized deductions (clerkage, 25%, 50%, 5% GST), check confirmed Tatkal rules, and find out how much money Indian Railways will refund to your bank account.",
  keywords: [
    "irctc refund calculator",
    "railway ticket cancellation charges",
    "train ticket refund amount",
    "irctc cancellation rules 2026",
    "tatkal cancellation refund",
    "3rd ac cancellation charges",
    "sleeper class cancellation fee",
    "tdr refund irctc",
    "train ticket cancellation time limits",
    "how much refund on ticket cancellation",
  ],
  alternates: {
    canonical: "/refund-calculator",
  },
  openGraph: {
    title: "IRCTC Railway Ticket Cancellation & Refund Calculator",
    description:
      "Find out your exact refund before cancelling your train ticket. See every single rupee deducted, cited Railway Board rules, and prevent losing 50% to 100% of your fare.",
    url: "https://wayvia.xyz/refund-calculator",
    siteName: "Wayvia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wayvia IRCTC Train Ticket Refund Calculator",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IRCTC Train Ticket Refund Calculator | Wayvia",
    description:
      "Calculate your exact railway refund before cancelling. Itemized clerkage, GST, Tatkal, and TDR filing breakdown.",
    images: ["/og-image.png"],
  },
};

export default function RefundCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Wayvia IRCTC Train Ticket Refund Calculator",
        url: "https://wayvia.xyz/refund-calculator",
        applicationCategory: "TravelApplication",
        operatingSystem: "All",
        description:
          "Official Indian Railways and IRCTC ticket cancellation and refund calculator. Calculates exact deduction slabs, clerkage, 5% GST, and net bank refund amounts.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How much does IRCTC deduct for cancelling a 3rd AC (3A) ticket?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "For 3A, 3E, and Chair Car (CC), if cancelled more than 48 hours before scheduled departure, IRCTC deducts a flat fee of ₹180 + 5% GST = ₹189 per passenger. If cancelled between 48 and 12 hours prior, 25% of the fare is deducted (min ₹189). Between 12 and 4 hours prior, 50% is deducted. Under 4 hours or after chart preparation, zero refund is granted.",
            },
          },
          {
            "@type": "Question",
            name: "Can I get a refund if I cancel a Confirmed Tatkal ticket?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Confirmed Tatkal tickets carry zero refund upon cancellation by passenger. 100% of the fare is forfeited under IRCTC Tatkal rules. Exceptions apply only if the train is cancelled by Railways or delayed > 3 hours (via TDR).",
            },
          },
          {
            "@type": "Question",
            name: "What happens to waitlisted (WL) e-tickets after chart preparation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Fully waitlisted e-tickets are automatically cancelled upon chart preparation. A flat clerkage charge of ₹60 per passenger (+ 5% GST for AC) is deducted, and the remaining balance is refunded directly to your bank/UPI account within 3 to 5 working days.",
            },
          },
          {
            "@type": "Question",
            name: "How long does IRCTC take to refund money to UPI or Bank Accounts?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Refunds for standard cancelled e-tickets credit to the original UPI VPA, card, or NetBanking account within 3 to 5 business days.",
            },
          },
        ],
      },
    ],
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
            Loading calculator…
          </div>
        }
      >
        <RefundCalculatorClient />
      </Suspense>
    </>
  );
}
