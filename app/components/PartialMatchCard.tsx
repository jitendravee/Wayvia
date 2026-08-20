import type { PartialCoverage } from "../types";
import { Badge, StatusBadge } from "./Badge";
import { signalFor, SIGNAL_LABEL } from "./status";

/**
 * Renders a single "partway there" match: a real train covering either
 * origin -> junction or junction -> destination, when no fully-connecting
 * journey was found. Deliberately lighter-weight than JourneyCard (no map,
 * no route strip) since this is a supplementary suggestion, not a booked-able
 * end-to-end plan.
 */
export default function PartialMatchCard({ match }: { match: PartialCoverage }) {
  const { leg } = match;
  const signal = signalFor(leg.availability?.category);

  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-alt/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-soft px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-dark">
          {match.type === "reaches_hub" ? "Gets you to a junction" : "Covers the last stretch"}
        </span>
        {leg.fare !== null && <Badge variant="fare">₹{leg.fare}</Badge>}
        <Badge>
          {leg.from} → {leg.to}
        </Badge>
        <StatusBadge fullyConfirmed={signal === "clear"} hasBlockedLeg={signal === "stop"} />
      </div>

      <div className="mt-2.5 font-mono text-[13px] text-ink">
        <span className="font-semibold">
          {leg.trainName} · #{leg.trainNo}
        </span>
        <span className="text-ink-dim">
          {" "}
          — {leg.departure} → {leg.arrival} ({leg.travelTime})
        </span>
      </div>

      {leg.availability && (
        <div className="mt-1 font-mono text-[11px] text-ink-dim">
          Seat status: {SIGNAL_LABEL[leg.availability.category]}
          {leg.availability.count != null ? ` (${leg.availability.count})` : ""}
        </div>
      )}

      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{match.note}</p>
    </div>
  );
}