"use client";

import { RunningStatusResult, RunningStatusStop } from "@/lib/erail/runningStatus";

const COACH_COLORS: Record<string, string> = {
  L: "bg-violet text-white", // loco/LPR
  G: "bg-surface-alt text-ink-muted border border-border", // general
  S: "bg-signal-green-soft text-signal-green", // sleeper
  P: "bg-signal-amber-soft text-signal-amber", // pantry
  H: "bg-violet-soft text-violet-dark", // AC chair / half-AC
  A: "bg-violet-soft text-violet-dark", // 1A
  B: "bg-violet-soft text-violet-dark", // 3A
  M: "bg-violet-soft text-violet-dark", // 2A
  E: "bg-surface-alt text-ink-dim border border-border", // engine
};

function coachClass(code: string): string {
  const key = code[0]?.toUpperCase();
  return COACH_COLORS[key] ?? "bg-surface-alt text-ink-muted border border-border";
}

function delayTone(min: number | null | undefined): { label: string; className: string } {
  if (min === null || min === undefined) return { label: "—", className: "bg-surface-alt text-ink-dim" };
  if (min <= 0) return { label: "On time", className: "bg-signal-green-soft text-signal-green" };
  if (min < 30) return { label: `${min}m late`, className: "bg-signal-amber-soft text-signal-amber" };
  return { label: `${min}m late`, className: "bg-signal-red-soft text-signal-red" };
}

export default function RunningStatusTracker({ data }: { data: RunningStatusResult }) {
  const { summary, position, stations, rake } = data;
  const overallDelay = summary?.departure.delayMin ?? summary?.arrival.delayMin ?? null;
  const tone = delayTone(overallDelay);

  return (
    <div className="space-y-6">
      {/* Headline status card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft bg-surface-alt px-5 py-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
              {data.trainNo} {data.runDate ? `· running ${data.runDate}` : ""}
            </div>
            <h1 className="font-display text-xl font-semibold text-ink">{data.trainName ?? "Train"}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 font-mono text-[12px] font-semibold ${tone.className}`}>
            {tone.label}
          </span>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
          <Stat label="Platform" value={summary?.platform ?? "—"} />
          <Stat
            label="Scheduled departure"
            value={summary?.departure.scheduled ?? "—"}
          />
          <Stat
            label="Actual / expected"
            value={summary?.departure.actual ?? "—"}
            highlight={!!overallDelay && overallDelay > 0}
          />
        </div>

        {summary?.statusMessage && (
          <div className="border-t border-border-soft bg-signal-amber-soft/40 px-5 py-3 text-[13px] leading-relaxed text-ink">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal-amber align-middle" />
            {summary.statusMessage}
          </div>
        )}

        {(summary?.nextStoppingStation || summary?.nextStationNonStop) && (
          <div className="flex flex-wrap gap-4 border-t border-border-soft px-5 py-3 text-[12.5px] text-ink-muted">
            {summary?.nextStationNonStop && (
              <span>
                Passing next: <span className="font-semibold text-ink">{summary.nextStationNonStop}</span>
              </span>
            )}
            {summary?.nextStoppingStation && (
              <span>
                Next stop: <span className="font-semibold text-ink">{summary.nextStoppingStation}</span>
              </span>
            )}
            {summary?.lastUpdated && <span className="ml-auto text-ink-dim">Updated {summary.lastUpdated}</span>}
          </div>
        )}
      </div>

      {/* Journey timeline / tracker */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink-dim">Journey tracker</div>
        <ol className="relative">
          {stations.map((s, i) => (
            <StopRow key={`${s.station}-${i}`} stop={s} isLast={i === stations.length - 1} />
          ))}
          {position && (
            <li className="relative ml-[15px] flex items-start gap-3 border-l-2 border-dashed border-violet pb-6 pl-6">
              <span className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-white shadow-[0_0_0_4px_rgba(124,58,237,0.15)]">
                <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5">
                  <path d="M4 12h16M14 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="rounded-lg bg-violet-soft px-3 py-2 text-[12.5px] text-violet-dark">
                <span className="font-semibold">Live position:</span> {position.raw}
              </div>
            </li>
          )}
        </ol>
      </div>

      {/* Rake composition */}
      {rake.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            Rake composition · {rake.length} coaches
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rake.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${coachClass(c)}`}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-2 font-mono text-[10px] text-ink-dim">
            Coach order is engine-to-last-coach as listed by erail.in and may not reflect platform-side boarding order.
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{label}</div>
      <div className={`mt-0.5 font-display text-[15px] font-semibold ${highlight ? "text-signal-amber" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function StopRow({ stop, isLast }: { stop: RunningStatusStop; isLast: boolean }) {
  const arrTone = delayTone(stop.arrivalDelayMin);
  const depTone = delayTone(stop.departureDelayMin);
  const departed = stop.status === "departed";

  return (
    <li className={`relative ml-[15px] flex items-start gap-3 pb-6 pl-6 ${isLast ? "" : "border-l-2 border-border"}`}>
      <span
        className={`absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          departed
            ? "border-signal-green bg-signal-green"
            : stop.major
            ? "border-violet bg-white"
            : "border-ink-dim bg-white"
        }`}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-display text-[14.5px] font-semibold ${stop.major ? "text-ink" : "text-ink-muted"}`}>
              {stop.station}
            </span>
            {stop.platform && (
              <span className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
                PF {stop.platform}
              </span>
            )}
            {stop.isOrigin && <span className="rounded bg-violet-soft px-1.5 py-0.5 font-mono text-[10px] text-violet-dark">Origin</span>}
            {stop.isDestination && (
              <span className="rounded bg-violet-soft px-1.5 py-0.5 font-mono text-[10px] text-violet-dark">Destination</span>
            )}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-3 font-mono text-[12px] text-ink-muted">
          {stop.arrival && (
            <span className="flex items-center gap-1.5">
              Arr {stop.arrival.time}
              {stop.arrivalDelayMin !== null && (
                <span className={`rounded px-1.5 py-0.5 text-[10.5px] ${arrTone.className}`}>{arrTone.label}</span>
              )}
            </span>
          )}
          {stop.departure && (
            <span className="flex items-center gap-1.5">
              Dep {stop.departure.time}
              {stop.departureDelayMin !== null && (
                <span className={`rounded px-1.5 py-0.5 text-[10.5px] ${depTone.className}`}>{depTone.label}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
