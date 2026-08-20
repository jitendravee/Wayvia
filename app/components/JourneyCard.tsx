"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AnnotatedJourney } from "../types";
import RouteStrip from "./RouteStrip";
import { Badge, StatusBadge, TagBadge } from "./Badge";
import { durationLabel } from "./status";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="mt-4 h-[320px] w-full animate-pulse rounded-xl border border-border bg-surface-alt" />,
});

export default function JourneyCard({ journey, tag }: { journey: AnnotatedJourney; tag?: string }) {
  const [showMap, setShowMap] = useState(false);
  const viaChain = [journey.hub, journey.hub2, journey.hub3].filter((h): h is string => Boolean(h));

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tag && <TagBadge>{tag}</TagBadge>}
        {journey.totalFare !== null && <Badge variant="fare">₹{journey.totalFare}</Badge>}
        <Badge variant="duration">{durationLabel(journey.totalDurationMin)}</Badge>
        <Badge>{journey.connections === 0 ? "direct" : `${journey.connections} connection${journey.connections > 1 ? "s" : ""}`}</Badge>
        {viaChain.length > 0 && <Badge>via {viaChain.join(" → ")}</Badge>}
        <StatusBadge fullyConfirmed={journey.fullyConfirmed} hasBlockedLeg={journey.hasBlockedLeg} />

        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:border-violet-ring hover:text-violet"
        >
          {showMap ? "Hide map" : "View map"}
        </button>
      </div>

      <RouteStrip legs={journey.legs} />

      {showMap && <RouteMap legs={journey.legs} />}

      <div className="space-y-1 border-t border-border-soft pt-3">
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
