import type { Metadata } from "next";
import TrainSearchBox from "../components/TrainSearchBox";
import { POPULAR_TRAINS } from "@/lib/trains";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Live Train Running Status",
  description:
    "Check live running status for any Indian Railways train. Enter a train number or name to see current location, delay, next stop, and full station-wise schedule.",
  keywords: [
    "train running status",
    "live train status",
    "where is my train",
    "train current location",
    "Indian railway train tracking",
    "train delay status",
    "spot your train",
    "train platform number",
    "train schedule today",
  ],
  alternates: {
    canonical: "/running-status",
  },
  openGraph: {
    title: "Live Train Running Status — Track Any Indian Railways Train | Wayvia",
    description:
      "Real-time train tracking for Indian Railways. See current station, delay, platform number, and full station-by-station schedule.",
    url: "https://wayvia.xyz/running-status",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Train Running Status | Wayvia",
    description:
      "Track any Indian Railways train in real time. Current location, delay, next stop, and full schedule.",
  },
};

export default function RunningStatusHub() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Wayvia Live Train Running Status",
      applicationCategory: "TravelApplication",
      operatingSystem: "All",
      url: "https://wayvia.xyz/running-status",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How to check live train running status online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter the train number or name on Wayvia's running status page to see real-time location, delay in minutes, next station, and full station-by-station schedule. Data is sourced from Indian Railways and updated every 2-5 minutes."
          }
        },
        {
          "@type": "Question",
          name: "What information does the live train running status show?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The live running status shows the train's current station, expected arrival and departure times, actual times, delay in minutes (if any), platform number at upcoming stations, and distance remaining to your destination."
          }
        },
        {
          "@type": "Question",
          name: "How accurate is live train running status?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Running status data is sourced from Indian Railways' official systems and is typically accurate within 2-5 minutes of real-time position. Signal areas and remote sections may have slightly longer update intervals."
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
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-6">
      <header className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
          Running status
        </div>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Track any train, live
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-ink-muted">
          Enter a train number or name below to see where it is right now, how
          delayed it is, and its full station-by-station schedule.
        </p>
      </header>

      <div className="mx-auto mt-8 max-w-xl">
        <TrainSearchBox autoFocus />
      </div>

      <section className="mt-12">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
          Popular trains
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {POPULAR_TRAINS.map((t) => (
            <Link
              key={t.trainNo}
              href={`/running-status/${t.trainNo}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-[13.5px] transition-colors hover:border-violet"
            >
              <span className="flex items-center gap-2.5 truncate">
                <span className="shrink-0 rounded-md bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-muted">
                  {t.trainNo}
                </span>
                <span className="truncate font-medium text-ink">
                  {t.trainName}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-dim">
                {t.from} → {t.to}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
    </>
  );
}
