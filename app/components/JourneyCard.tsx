"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AnnotatedJourney } from "../types";
import RouteStrip from "./RouteStrip";
import { Badge, StatusBadge, TagBadge } from "./Badge";
import { durationLabel } from "./status";
import { ChevronDownIcon, ClockIcon, JunctionIcon, WalletIcon } from "./Icons";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="mt-4 h-[280px] w-full animate-pulse rounded-xl border border-border bg-surface-alt" />,
});

const BEST_OVERALL_TAG = "Best overall";

export default function JourneyCard({ journey, tag }: { journey: AnnotatedJourney; tag?: string }) {
  const isBest = tag === BEST_OVERALL_TAG;
  const [showMap, setShowMap] = useState(isBest);
  const viaChain = [journey.hub, journey.hub2, journey.hub3].filter((h): h is string => Boolean(h));

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isBest ? "border-violet-ring shadow-violet-soft/50 ring-1 ring-violet-ring" : "border-border"
      }`}
    >
      {isBest && <div className="h-1 w-full bg-gradient-to-r from-violet via-violet-dark to-violet" />}

      <div className={`p-4 sm:p-5 ${isBest ? "bg-gradient-to-br from-violet-soft/30 to-white" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {tag && <TagBadge>{tag}</TagBadge>}

          {journey.totalFare !== null && (
            <span className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] font-semibold text-ink shadow-sm">
              <WalletIcon className="h-3.5 w-3.5 text-violet" />₹{journey.totalFare}
            </span>
          )}

          <span className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] text-ink-muted shadow-sm">
            <ClockIcon className="h-3.5 w-3.5 text-violet" />
            {durationLabel(journey.totalDurationMin)}
          </span>

          <span className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] text-ink-muted shadow-sm">
            <JunctionIcon className="h-3.5 w-3.5 text-violet" />
            {journey.connections === 0 ? "direct" : `${journey.connections} connection${journey.connections > 1 ? "s" : ""}`}
          </span>

          {viaChain.length > 0 && <Badge>via {viaChain.join(" → ")}</Badge>}

          <StatusBadge fullyConfirmed={journey.fullyConfirmed} hasBlockedLeg={journey.hasBlockedLeg} />

          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="ml-auto flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-ink-muted shadow-sm transition-colors hover:border-violet-ring hover:text-violet"
          >
            {showMap ? "Hide path" : "View path"}
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${showMap ? "rotate-180" : ""}`} />
          </button>
        </div>

        <RouteStrip legs={journey.legs} />

        {showMap && <RouteMap legs={journey.legs} />}

        <div className="mt-1 divide-y divide-border-soft/70 rounded-lg border border-border-soft bg-surface-alt/40">
          {journey.legs.map((leg, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-3 py-2 font-mono text-[12px] text-ink-muted"
            >
              <span className="text-ink">
                #{leg.trainNo} <span className="text-ink-muted">{leg.trainName}</span> · {leg.from} → {leg.to}
              </span>
              <span>
                {leg.departure} → {leg.arrival}
                {leg.fare !== null ? ` · ₹${leg.fare}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}