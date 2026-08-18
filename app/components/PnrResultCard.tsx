"use client";

import SeatMap from "./SeatMap";
import { PnrData } from "@/lib/erail/pnrTypes";

const STATUS_TONE: Record<string, string> = {
  CNF: "bg-signal-green-soft text-signal-green",
  RAC: "bg-signal-amber-soft text-signal-amber",
  WL: "bg-signal-red-soft text-signal-red",
};

function toneFor(status?: string) {
  if (!status) return "bg-surface-alt text-ink-muted";
  const key = Object.keys(STATUS_TONE).find((k) => status.toUpperCase().includes(k));
  return key ? STATUS_TONE[key] : "bg-surface-alt text-ink-muted";
}

export default function PnrResultCard({ data }: { data: PnrData }) {
  const passengers = data.passengerList ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border-soft bg-surface-alt px-5 py-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            PNR {data.pnrNumber} · {data.chartStatus ?? "Status unknown"}
          </div>
          <h1 className="mt-0.5 font-display text-xl font-semibold text-ink">
            {data.trainNumber} {data.trainName}
          </h1>
          <div className="mt-1 font-mono text-[12px] text-ink-muted">
            {data.sourceStation} → {data.destinationStation}
            {data.dateOfJourney ? ` · ${data.dateOfJourney}` : ""}
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-4">
          <Stat label="Class" value={data.journeyClass ?? "—"} />
          <Stat label="Quota" value={data.quota ?? "—"} />
          <Stat label="Boarding" value={data.boardingPoint ?? "—"} />
          <Stat label="Distance" value={data.distance ? `${data.distance} km` : "—"} />
        </div>

        {data.informationMessage && data.informationMessage.length > 0 && (
          <div className="space-y-1 border-t border-border-soft px-5 py-3">
            {data.informationMessage.map((m, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[12px] text-ink-muted">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-dim" />
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      {passengers.length > 0 && (
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            {passengers.length} passenger{passengers.length === 1 ? "" : "s"}
          </div>
          {passengers.map((p) => (
            <div key={p.passengerSerialNumber} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-display text-[14.5px] font-semibold text-ink">
                  Passenger {p.passengerSerialNumber}
                </div>
                <span className={`rounded-full px-3 py-1 font-mono text-[12px] font-semibold ${toneFor(p.currentStatus)}`}>
                  {p.currentStatusDetails ?? p.currentStatus ?? "Unknown"}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border-soft bg-surface-alt px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">At booking</div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">{p.bookingStatusDetails ?? "—"}</div>
                </div>
                <div className="rounded-lg border border-border-soft bg-surface-alt px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Current</div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">{p.currentStatusDetails ?? "—"}</div>
                </div>
              </div>

              {p.currentCoachId && p.currentBerthNo && data.journeyClass && (
                <div className="mt-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    Coach {p.currentCoachId} · Berth {p.currentBerthNo} ({p.currentBerthCode})
                  </div>
                  <SeatMap coachClass={data.journeyClass} highlightSeat={p.currentBerthNo} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="mt-0.5 font-display text-[14px] font-semibold text-ink">{value}</div>
    </div>
  );
}
