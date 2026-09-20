"use client";
import Link from "next/link";
import SeatMap from "./SeatMap";
import { PnrData } from "@/lib/erail/pnrTypes";
import { Calculator } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  CNF: "bg-signal-green-soft text-signal-green",
  RAC: "bg-signal-amber-soft text-signal-amber",
  WL: "bg-signal-red-soft text-signal-red",
};

function toneFor(status?: string) {
  if (!status) return "bg-surface-alt text-ink-muted";
  const key = Object.keys(STATUS_TONE).find((k) =>
    status.toUpperCase().includes(k),
  );
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
          <Stat
            label="Distance"
            value={data.distance ? `${data.distance} km` : "—"}
          />
        </div>

        {data.informationMessage && data.informationMessage.length > 0 && (
          <div className="space-y-1 border-t border-border-soft px-5 py-3">
            {data.informationMessage.map((m, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[12px] text-ink-muted"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-dim" />
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-violet/20 bg-gradient-to-r from-violet/5 via-surface-alt to-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet text-white shadow-xs">
            <Calculator size={18} />
          </div>
          <div>
            <div className="text-xs font-semibold text-ink">
              Thinking of cancelling this ticket?
            </div>
            <div className="text-[11px] text-ink-muted">
              Check exact deductions, GST, and net bank refund before cancelling
            </div>
          </div>
        </div>
        <Link
          href={`/refund-calculator?pnr=${data.pnrNumber}`}
          className="shrink-0 rounded-xl bg-violet px-3.5 py-2 font-display text-xs font-semibold text-white shadow-sm hover:bg-violet-dark transition-all"
        >
          Calculate Refund →
        </Link>
      </div>

      {passengers.length > 0 && (
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            {passengers.length} passenger{passengers.length === 1 ? "" : "s"}
          </div>
          {passengers.map((p) => (
            <div
              key={p.passengerSerialNumber}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-display text-[14.5px] font-semibold text-ink">
                  Passenger {p.passengerSerialNumber}
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-mono text-[12px] font-semibold ${toneFor(p.currentStatus)}`}
                >
                  {p.currentStatusDetails ?? p.currentStatus ?? "Unknown"}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border-soft bg-surface-alt px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    At booking
                  </div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">
                    {p.bookingStatusDetails ?? "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border-soft bg-surface-alt px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    Current
                  </div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">
                    {p.currentStatusDetails ?? "—"}
                  </div>
                </div>
              </div>

              {p.currentCoachId && p.currentBerthNo && data.journeyClass && (
                <div className="mt-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    Coach {p.currentCoachId} · Berth {p.currentBerthNo} (
                    {p.currentBerthCode})
                  </div>
                  <SeatMap
                    coachClass={data.journeyClass}
                    highlightSeat={p.currentBerthNo}
                  />
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
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
        {label}
      </div>
      <div className="mt-0.5 font-display text-[14px] font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}
