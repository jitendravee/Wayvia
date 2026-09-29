import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageInner } from "../components/PageClient";

export const metadata: Metadata = {
  title:
    "Smart Train & Bus Journey Planner — Confirmed Routes When Direct Trains Are Full",
  description:
    "Direct trains waitlisted or full? Wayvia discovers connecting trains via junction hubs, train + bus combos, and split-ticket options with confirmed seats across India.",
  keywords: [
    "train journey planner",
    "alternative train routes",
    "connecting train search",
    "confirmed train ticket options",
    "train bus combo booking",
    "waitlist ticket alternative",
    "smart train routes india",
  ],
  alternates: {
    canonical: "/journey-planner",
  },
  openGraph: {
    title: "Smart Train & Bus Journey Planner | Wayvia",
    description:
      "Find connecting trains via hubs and multi-modal options when direct trains are sold out.",
  },
};

export default async function Page() {
  await connection();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Wayvia Smart Journey Planner",
      applicationCategory: "TravelApplication",
      operatingSystem: "All",
      url: "https://wayvia.xyz/journey-planner",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Wayvia find alternative train routes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Wayvia's journey engine simultaneously searches direct trains and connecting routes through nearby railway junctions. It checks live seat availability on each leg — Available, RAC, Waitlist, or Not Available — and only recommends combinations that are actually bookable, ranked by price, speed, reliability, and convenience."
          }
        },
        {
          "@type": "Question",
          name: "What is a connecting train route?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A connecting route splits your journey into 2 or more legs through an intermediate junction station. For example, Delhi → Mumbai might show Delhi → Vadodara → Mumbai if the direct trains are waitlisted but both connecting legs have confirmed seats. Wayvia checks real availability before recommending any connection."
          }
        },
        {
          "@type": "Question",
          name: "Can Wayvia find bus + train combinations?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Wayvia supports multimodal search. If a gap between two train legs can't be covered by another train, Wayvia searches for bus connections to bridge the gap, showing you combined train-bus options with total journey time and cost."
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
      <Suspense fallback={null}>
        <div className="mt-20">
          <PageInner />
        </div>
      </Suspense>
    </>
  );
}
