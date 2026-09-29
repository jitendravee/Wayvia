import type { Metadata } from "next";
import Link from "next/link";
import { POPULAR_ROUTES } from "@/lib/popularRoutes";

export const metadata: Metadata = {
  title: "Popular train routes & alternative routes across India",
  description:
    "Browse popular train routes across India, including alternative and connecting routes when direct trains are full — Delhi to Mumbai, Delhi to Bangalore, Chennai to Delhi, and more.",
  alternates: { canonical: "/routes" },
  keywords: [
    "Indian train routes",
    "connecting train routes",
    "alternative train routes",
    "busiest train routes in India",
    "Waitlist alternatives",
  ],
  openGraph: {
    title: "Popular train routes & alternative routes across India | Wayvia",
    description:
      "Browse popular train routes across India, including alternative and connecting routes when direct trains are full.",
    url: "https://wayvia.xyz/routes",
    siteName: "Wayvia",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popular train routes & alternative routes across India | Wayvia",
    description:
      "Browse popular train routes across India, including alternative and connecting routes when direct trains are full.",
  },
};

export default function RoutesIndexPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Popular train routes across India",
    description: "Browse popular train routes across India, including alternative and connecting routes when direct trains are full.",
    url: "https://wayvia.xyz/routes",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: POPULAR_ROUTES.map((r, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://wayvia.xyz/routes/${r.slug}`,
        name: `${r.fromCity} to ${r.toCity}`
      }))
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the busiest train routes in India?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The most popular train routes include Delhi to Mumbai (1,384 km, 15+ daily trains), Delhi to Kolkata (1,447 km, 12+ daily trains), Chennai to Bangalore (346 km, 10+ daily trains), Mumbai to Goa (588 km, 8+ daily trains), and Delhi to Jaipur (308 km, 15+ daily trains). These routes have the highest booking demand, especially during festival seasons."
        }
      },
      {
        "@type": "Question",
        name: "How to find confirmed seats when direct trains are full?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use Wayvia's journey planner to discover connecting routes through nearby junctions. For example, if Delhi → Mumbai direct is waitlisted, you might find Delhi → Vadodara → Mumbai with confirmed seats on both legs. Wayvia checks live availability automatically."
        }
      }
    ]
  };

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
        Popular routes
      </div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">
        Popular train routes across India
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        Direct trains aren&rsquo;t always the fastest or cheapest way there —
        and they&rsquo;re not always available. These routes show where
        connecting via a nearby junction is worth checking.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {POPULAR_ROUTES.map((r) => (
          <Link
            key={r.slug}
            href={`/routes/${r.slug}`}
            className="group rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
              {r.fromCode} → {r.toCode}
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-ink group-hover:text-violet">
              {r.fromCity} to {r.toCity}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
              {r.blurb}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.hubs.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-violet-soft px-2.5 py-0.5 font-mono text-[10px] text-violet-dark"
                >
                  via {h}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
