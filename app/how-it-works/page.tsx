import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Wayvia finds your route — direct, connecting, and ranked by what matters",
  description:
    "How Wayvia's journey engine works: we search direct trains and connecting routes through nearby junctions at the same time, check live availability, and rank every option by price, speed, and reliability.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    title: "1. Tell us where you're headed",
    body: "Enter your origin, destination, date, class, and quota. No account needed to search.",
  },
  {
    title: "2. We search direct and connecting routes together",
    body: "Wayvia doesn't wait to see if direct trains look thin before checking alternatives. Both are explored at the same time, every search — through nearby junctions and hubs relevant to your route.",
  },
  {
    title: "3. Every leg is checked against live availability",
    body: "We don't generate theoretical routes. Each candidate combination is checked against real, live seat data — available, waitlisted, RAC, or unavailable — before it's ever shown to you.",
  },
  {
    title: "4. Everything gets ranked, not just listed",
    body: "Results are scored on price, total journey time, number of connections, reliability, and convenience — then surfaced as clear picks: Best Overall, Cheapest, Fastest, Easiest, and Most Reliable.",
  },
  {
    title: "5. Filter down to what matters to you",
    body: "Narrow by direct-only or one change max, by time of day you'd like to depart, by fully-confirmed-only, or by a maximum fare — all live, without a new search.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">How it works</div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">
        Finding the smartest way to get there, step by step
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        A normal train search shows you a list of direct trains. Wayvia builds out the full picture — direct and
        connecting — and checks whether it&rsquo;s actually bookable before recommending it.
      </p>

      <div className="mt-10 space-y-6">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-white p-5">
            <div className="font-display text-base font-semibold text-ink">{s.title}</div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface-alt p-6">
        <div className="font-display text-lg font-semibold text-ink">Ready to see it in action?</div>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-violet px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
        >
          Search a journey
        </Link>
      </div>
    </main>
  );
}
