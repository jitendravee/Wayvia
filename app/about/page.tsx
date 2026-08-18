import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Wayvia — a journey discovery platform, not a booking site",
  description:
    "Wayvia is building a smart journey discovery platform. We find the best way to get from A to B by exploring direct and connecting routes, checking live availability, and ranking by price, time, and reliability.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">About</div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">
        We&rsquo;re not building another ticket search site.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        Wayvia is a smart journey discovery platform. The idea is simple: you tell us where you want to go, and
        instead of only showing you the direct option, we find the best possible way to get there.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">What Wayvia actually does</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          We&rsquo;re starting with trains, but the platform is designed to eventually support trains, buses, and
          flights together. Search Delhi → Mumbai on a typical travel site and you&rsquo;ll mostly see direct trains
          or flights. Wayvia goes further — it explores connecting routes through relevant junctions and hubs, and
          checks real, live availability to find combinations that may be cheaper, faster, easier, more reliable, or
          simply the only practical way to reach your destination.
        </p>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          So instead of only seeing a direct Delhi → Mumbai train, you might see Delhi → Vadodara → Mumbai — a real,
          bookable combination, not a theoretical one. We check whether each leg is actually available, waitlisted,
          RAC, or unavailable before we ever recommend it.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">A journey-finding engine, not a transport search engine</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          Most travel sites answer &ldquo;which direct train goes there?&rdquo; We answer a different question:
          &ldquo;what&rsquo;s the best way for me to get there?&rdquo; Wayvia explores a large number of possible
          combinations and ranks them by availability, price, total journey time, number of connections, reliability,
          and convenience — then surfaces clear picks like Best Overall, Cheapest, Fastest, Easiest, and Most
          Reliable.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">Where we&rsquo;re headed</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          We&rsquo;re launching with train travel, but the vision isn&rsquo;t train-only. The same idea should
          eventually work across train, bus, and flight — and combinations between them. Delhi → Jaipur → Mumbai
          could one day be train + train, bus + train, flight + train, or any mix that gets you there best. The
          long-term goal is one place that finds the smartest way to get you from A to B, whatever mode that takes.
        </p>
      </section>

      <div className="mt-12 rounded-2xl border border-border bg-surface-alt p-6">
        <div className="font-display text-lg font-semibold text-ink">You tell us where you want to go.</div>
        <div className="mt-1 text-[14px] text-ink-muted">We figure out the best way to get you there.</div>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-violet px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
        >
          Try a journey search
        </Link>
      </div>
    </main>
  );
}
