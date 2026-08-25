import Link from "next/link";
import TrainSearchBox from "./components/TrainSearchBox";
import { POPULAR_TRAINS } from "@/lib/trains";
import { PageInner } from "./components/PageClient";
import { Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/landing/Hero";
import Image from "next/image";
import HowWayviaThinks from "./components/landing/HowWayviaThinks";
import WeDontStopAtFirstRoute from "./components/landing/WeDontStopCheckList";
import AddAStopSection from "./components/landing/AddAStopSection";

export default function Page() {
  return (
    <main className="flex flex-col gap-10 md:gap-20 h-full w-full">
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-gray-50 min-h-[620px] py-14 sm:min-h-[680px] sm:py-16 lg:h-[90vh] lg:py-0">
        {/* Responsive background image — purely decorative, always fills the
            section (object-cover) no matter what height the section ends up
            at. It never drives layout; the content column below does. */}
        <picture className="absolute inset-0 block h-full w-full">
          {/* Mobile */}
          <source media="(max-width: 767px)" srcSet="/mobile-hero.png" />

          {/* Tablet */}
          <source
            media="(min-width: 768px) and (max-width: 1199px)"
            srcSet="/tablet-hero.png"
          />

          {/* Desktop */}
          <img
            src="/hero.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-white/80 md:from-white/40 to-transparent" />

        {/* Hero content — a normal flowing column. On small screens the
            section grows to fit it (min-h + padding above); on large
            screens it's vertically centered inside the fixed 90vh box. */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-5 sm:px-6">
          <Hero />
        </div>
      </section>
      <section>
        <HowWayviaThinks />
      </section>
      <section>
        <WeDontStopAtFirstRoute />
      </section>
      <AddAStopSection />
      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-6">
        <div className="mb-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            How it works
          </div>

          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Three steps, live data
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <HowStep
            step="1"
            title="Search your train"
            body="Type the train number or name. We show live suggestions as you type, with a preview of the top match's status before you even hit enter."
          />

          <HowStep
            step="2"
            title="See exactly where it is"
            body="A station-by-station journey tracker shows what's departed, what's next, and how many minutes late (or early) it's running at each stop."
          />

          <HowStep
            step="3"
            title="Check your PNR"
            body="Enter your 10-digit PNR to see confirmation status, coach and berth, and a visual seat map showing exactly where you're seated."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-6">
        <div className="mb-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            Why Wayvia
          </div>

          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Built for the platform, not the timetable
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Feature
            icon="⏱"
            title="Real delay tracking"
            body="Cumulative delay at arrival and departure for every stop, not just a single headline number."
          />

          <Feature
            icon="🚉"
            title="Live position marker"
            body="See exactly which station your train last departed and how far it is from the next stop."
          />

          <Feature
            icon="🪑"
            title="Visual seat maps"
            body="PNR results come with a real berth diagram — lower, middle, upper, and side berths — with your seat highlighted."
          />

          <Feature
            icon="🚃"
            title="Rake composition"
            body="See the full coach order of your train, from the engine to the last general coach."
          />
        </div>
      </section>

      {/* SEO */}
      <section className="mx-auto max-w-4xl border-t border-border px-5 py-8 text-[13px] leading-relaxed text-ink-dim sm:px-6">
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Live train running status &amp; PNR status, in one place
        </h2>

        <p>
          Wayvia gives you real-time Indian Railways train running status and
          PNR status without the clutter. Search any train by its 4 or 5-digit
          number — like 10103 Mandovi Express or 12951 Mumbai Rajdhani — and get
          a live, station-by-station view of where it is, how delayed it is, and
          when it&rsquo;s expected next.
        </p>
      </section>
    </main>
  );
}
function HowStep({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-soft font-mono text-[12px] font-bold text-violet-dark">
        {step}
      </span>
      <div className="mt-3 font-display text-[15px] font-semibold text-ink">
        {title}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        {body}
      </p>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-border bg-white p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-lg">
        {icon}
      </span>
      <div>
        <div className="font-display text-[15px] font-semibold text-ink">
          {title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
          {body}
        </p>
      </div>
    </div>
  );
}
