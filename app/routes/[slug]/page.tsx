import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPopularRoute, POPULAR_ROUTES } from "@/lib/popularRoutes";

export function generateStaticParams() {
  return POPULAR_ROUTES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = getPopularRoute(slug);
  if (!route) return {};
  return {
    title: `${route.fromCity} to ${route.toCity} train — direct & alternative routes`,
    description: `Find the best way from ${route.fromCity} to ${route.toCity}: direct trains, connecting routes via ${route.hubs.join(", ")}, live availability, and fare comparison. ${route.blurb}`,
    keywords: route.keywords,
    alternates: { canonical: `/routes/${route.slug}` },
  };
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = getPopularRoute(slug);
  if (!route) notFound();

  const searchHref = `/?from=${route.fromCode}&to=${route.toCode}`;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
        {route.fromCode} → {route.toCode}
      </div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">
        {route.fromCity} to {route.toCity} train — direct and alternative routes
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{route.blurb}</p>

      <Link
        href={searchHref}
        className="mt-6 inline-block rounded-full bg-violet px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
      >
        Search {route.fromCity} → {route.toCity} now
      </Link>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Why check alternative routes for {route.fromCity} to {route.toCity}?
        </h2>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          Direct trains between {route.fromCity} and {route.toCity} are popular and fill up fast, especially close to
          travel dates. When that happens, a connecting route through a well-placed junction can be cheaper, faster
          to actually book, or simply the only option with confirmed seats. Common transfer points on this route
          include {route.hubs.join(", ")}.
        </p>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          Wayvia checks direct and connecting options together, against live seat availability, and ranks them by
          price, total travel time, and reliability — so you can compare the cheapest way to travel {route.fromCity}{" "}
          to {route.toCity} against the fastest, side by side.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Common transfer hubs</h2>
        <div className="flex flex-wrap gap-2">
          {route.hubs.map((h) => (
            <span key={h} className="rounded-full border border-border bg-surface-alt px-3 py-1 font-mono text-[12px] text-ink-muted">
              {h}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-2xl border border-border bg-surface-alt p-6">
        <div className="font-display text-lg font-semibold text-ink">
          Ready to see live options for {route.fromCity} → {route.toCity}?
        </div>
        <Link
          href={searchHref}
          className="mt-4 inline-block rounded-full bg-violet px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
        >
          Find my journey
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/routes" className="text-[13px] font-medium text-violet hover:underline">
          ← Back to all popular routes
        </Link>
      </div>
    </main>
  );
}
