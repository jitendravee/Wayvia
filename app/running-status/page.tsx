import type { Metadata } from "next";
import TrainSearchBox from "../components/TrainSearchBox";
import { POPULAR_TRAINS } from "@/lib/trains";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Live Train Running Status",
  description:
    "Check live running status for any Indian Railways train. Enter a train number or name to see current location, delay, next stop, and full station-wise schedule.",
};

export default function RunningStatusHub() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-6">
      <header className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">Running status</div>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Track any train, live
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-ink-muted">
          Enter a train number or name below to see where it is right now, how delayed it is, and its full
          station-by-station schedule.
        </p>
      </header>

      <div className="mx-auto mt-8 max-w-xl">
        <TrainSearchBox autoFocus />
      </div>

      <section className="mt-12">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-dim">Popular trains</div>
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
                <span className="truncate font-medium text-ink">{t.trainName}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-dim">
                {t.from} → {t.to}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
