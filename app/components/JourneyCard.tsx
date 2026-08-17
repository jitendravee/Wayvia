import type { AnnotatedJourney } from "../types";
import RouteStrip from "./RouteStrip";
import { Badge, StatusBadge, TagBadge } from "./Badge";
import { durationLabel } from "./status";

export default function JourneyCard({ journey, tag }: { journey: AnnotatedJourney; tag?: string }) {
  return (
    <div className="rounded-lg border border-board-line bg-board-raised/50 p-4 transition-colors hover:border-flap-dim/40 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tag && <TagBadge>{tag}</TagBadge>}
        {journey.totalFare !== null && <Badge variant="fare">₹{journey.totalFare}</Badge>}
        <Badge variant="duration">{durationLabel(journey.totalDurationMin)}</Badge>
        <Badge>{journey.connections === 0 ? "direct" : `${journey.connections} connection${journey.connections > 1 ? "s" : ""}`}</Badge>
        {journey.hub && <Badge>via {journey.hub}</Badge>}
        <StatusBadge fullyConfirmed={journey.fullyConfirmed} hasBlockedLeg={journey.hasBlockedLeg} />
      </div>

      <RouteStrip legs={journey.legs} />

      <div className="space-y-1 border-t border-board-line-soft pt-3">
        {journey.legs.map((leg, i) => (
          <div key={i} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 font-mono text-[12px] text-ink-muted">
            <span>
              #{leg.trainNo} {leg.trainName} · {leg.from} → {leg.to}
            </span>
            <span>
              {leg.departure} → {leg.arrival}
              {leg.fare !== null ? ` · ₹${leg.fare}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
