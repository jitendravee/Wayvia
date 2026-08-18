import Link from "next/link";
import TrainSearchBox from "./components/TrainSearchBox";
import { POPULAR_TRAINS } from "@/lib/trains";
import { PageInner } from "./journey-planner/page";

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
      {/* Hero + search */}
      <PageInner />
      {/* <section className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">Wayvia · live train tracking</div>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Where&rsquo;s your train, right now?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-muted">
          Live running status, station-by-station delay tracking, and PNR confirmation — all in one clean,
          fast lookup. Just type a train number or name to get started.
        </p>

        <div className="mx-auto mt-8 max-w-xl text-left">
          <TrainSearchBox autoFocus />
        </div>

        <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[11px] text-ink-dim">Popular:</span>
          {POPULAR_TRAINS.slice(0, 5).map((t) => (
            <Link
              key={t.trainNo}
              href={`/running-status/${t.trainNo}`}
              className="rounded-full border border-border bg-white px-3 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:border-violet hover:text-violet"
            >
              {t.trainNo} · {t.trainName}
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-4 border-t border-border pt-5">
          <span className="text-[13px] text-ink-muted">Have a PNR instead?</span>
          <Link
            href="/pnr-status"
            className="font-display text-[13px] font-semibold text-violet hover:text-violet-dark"
          >
            Check PNR status →
          </Link>
        </div>
      </section> */}

      {/* How it works */}
      <section className="mt-20">
        <div className="mb-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">How it works</div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Three steps, live data</h2>
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

      {/* Features */}
      <section className="mt-20">
        <div className="mb-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Why Wayvia</div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Built for the platform, not the timetable</h2>
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

      {/* SEO copy */}
      <section className="mt-20 border-t border-border pt-8 text-[13px] leading-relaxed text-ink-dim">
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Live train running status &amp; PNR status, in one place
        </h2>
        <p>
          Wayvia gives you real-time Indian Railways train running status and PNR status without the clutter.
          Search any train by its 4 or 5-digit number — like 10103 Mandovi Express or 12951 Mumbai Rajdhani — and
          get a live, station-by-station view of where it is, how delayed it is, and when it&rsquo;s expected next.
          Pair that with instant PNR confirmation checks, complete with your coach, berth number, and a visual
          seat map, so you always know exactly where you stand before you reach the platform.
        </p>
      </section>
    </main>
  );
}

function HowStep({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-soft font-mono text-[12px] font-bold text-violet-dark">
        {step}
      </span>
      <div className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-border bg-white p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-lg">
        {icon}
      </span>
      <div>
        <div className="font-display text-[15px] font-semibold text-ink">{title}</div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{body}</p>
      </div>
    </div>
  );
}
