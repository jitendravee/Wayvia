"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  BusFront,
  MoveUpRight,
  Plane,
  TrainFront,
} from "lucide-react";
import type { AnnotatedJourney, AnnotatedLeg, Mode } from "../types";
import { Badge, StatusBadge } from "./Badge";
import { durationLabel } from "./status";
import { ChevronDownIcon, ClockIcon, JunctionIcon, WalletIcon } from "./Icons";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 h-[280px] w-full animate-pulse rounded-xl border border-border bg-surface-alt" />
  ),
});

const BEST_OVERALL_TAG = "Best overall";

const MODE_ICON: Record<
  Mode,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  train: TrainFront,
  bus: BusFront,
  flight: Plane,
};

/* ------------------------------------------------------------------ */
/* Tag pill — colour keyed off the tag text, matches the reference set  */
/* ------------------------------------------------------------------ */

const TAG_STYLES: Record<string, string> = {
  "Best overall": "bg-violet text-white",
  Cheapest: "bg-emerald-500 text-white",
  Fastest: "bg-amber-500 text-white",
  "Fewest changes": "bg-sky-500 text-white",
};
const DEFAULT_TAG_STYLE = "bg-ink-dim text-white";

function tagStyle(tag?: string) {
  if (!tag) return DEFAULT_TAG_STYLE;
  return TAG_STYLES[tag] ?? DEFAULT_TAG_STYLE;
}

function tagDisplay(tag: string) {
  return tag === BEST_OVERALL_TAG ? "Best match" : tag;
}

/* ------------------------------------------------------------------ */
/* Availability pill — reused in the timeline connector and segment card */
/* ------------------------------------------------------------------ */

const AVAILABILITY_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  RAC: "bg-amber-50 text-amber-700",
  WAITLIST: "bg-amber-50 text-amber-700",
  NOT_AVAILABLE: "bg-rose-50 text-rose-700",
  REGRET: "bg-rose-50 text-rose-700",
  UNKNOWN: "bg-surface-alt text-ink-dim",
};

export function AvailabilityPill({
  leg,
  compact = false,
}: {
  leg: AnnotatedLeg;
  compact?: boolean;
}) {
  const avl = leg.availability;
  if (!avl) return null;

  const label =
    avl.category === "AVAILABLE"
      ? `Available (${avl.count ?? "-"})`
      : avl.category === "NOT_AVAILABLE"
        ? "Not available"
        : avl.rawStatus;

  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full font-mono font-semibold ${
        AVAILABILITY_STYLE[avl.category] ?? AVAILABILITY_STYLE.UNKNOWN
      } ${compact ? "px-1.5 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"}`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* "02.42" -> "2h 42m"                                                  */
/* ------------------------------------------------------------------ */

function formatTravelTime(raw?: string): string {
  if (!raw) return "";
  const [h, m] = raw.split(".");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return raw;
  return `${hh}h ${String(mm).padStart(2, "0")}m`;
}

/* ------------------------------------------------------------------ */
/* Timeline building blocks                                             */
/* These are split out so the same "node" / "connector" visual language */
/* can be reused anywhere else a route needs to be drawn (e.g. a         */
/* compact list row, a share-card, a print view) without re-deriving     */
/* the layout math each time.                                            */
/* ------------------------------------------------------------------ */

const TIMELINE_NODE_WIDTH = "w-[72px]"; // fixed — stops never grow or shrink, so labels stay put
const TIMELINE_LEG_MIN_WIDTH = "min-w-[88px]"; // connectors are the ONLY flexible piece: they grow to
// fill spare room (so the row spans the full card on a wide screen, matching the reference design)
// and shrink no further than this floor — past that the row scrolls instead of collapsing.

/** A single station on the route (origin, junction, or destination). */
export function TimelineStopNode({
  code,
  time,
  isJunction,
  dayOffset,
}: {
  code: string;
  time: string;
  isJunction: boolean;
  dayOffset: number;
}) {
  return (
    <div
      className={`flex ${TIMELINE_NODE_WIDTH} shrink-0 flex-col items-center gap-1 px-1 text-center`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-violet bg-white" />
      <span className="font-display text-[13px] font-semibold leading-tight text-ink">
        {code}
      </span>
      <span className="whitespace-nowrap font-mono text-[11px] leading-tight text-ink-muted">
        {time}
        {dayOffset > 0 && <span className="text-violet"> +{dayOffset}d</span>}
      </span>
      {/* Reserve the row's height whether or not this stop is a junction, so */}
      {/* every column in the strip lines up regardless of neighbours.        */}
      <span className="font-mono text-[9.5px] uppercase leading-tight tracking-wide text-ink-dim">
        {isJunction ? "Junction" : "\u00A0"}
      </span>
    </div>
  );
}

/** The connector between two stops: mode icon, service label, availability.
 *  This is the row's only growable piece — see TIMELINE_LEG_MIN_WIDTH above. */
export function TimelineLegConnector({ leg }: { leg: AnnotatedLeg }) {
  const Icon = MODE_ICON[leg.mode];

  return (
    <div
      className={`flex ${TIMELINE_LEG_MIN_WIDTH} flex-1 flex-col items-center gap-1 px-1 pt-[5px]`}
    >
      <div className="flex w-full items-center gap-1">
        <span className="h-px min-w-[8px] flex-1 bg-border" />
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-ring bg-violet-soft text-violet">
          <Icon size={13} />
        </span>
        <span className="h-px min-w-[8px] flex-1 bg-border" />
      </div>
      <span className="w-full truncate text-center font-mono text-[10.5px] leading-tight text-ink-muted">
        {leg.mode === "train" ? `Train #${leg.trainNo}` : leg.trainName}
      </span>
      <AvailabilityPill leg={leg} compact />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Route timeline — the horizontal stepper across the top of the card   */
/* ------------------------------------------------------------------ */

export function RouteTimeline({ journey }: { journey: AnnotatedJourney }) {
  const stops = journey.routeStops;
  const baseDay = Math.floor(journey.legs[0].depAbsMin / 1440);

  // routeStops[0] is the origin (nothing "arrives" there); every stop after
  // that is the arrival end of journey.legs[i-1] — so the two arrays line
  // up 1:1 by index, and comparing each stop's absolute minute against the
  // very first departure tells us whether it lands a day (or more) later.
  const dayOffsets = [
    0,
    ...journey.legs.map((l) => Math.floor(l.arrAbsMin / 1440) - baseDay),
  ];

  return (
    // Always scrollable, on every breakpoint: if the row's min-width (all the
    // fixed stop nodes + each connector's min-width floor) exceeds the card's
    // actual rendered width, it scrolls instead of compressing/overlapping.
    //
    // Stops (TimelineStopNode) are fixed-width siblings; connectors
    // (TimelineLegConnector) are the only flexible siblings, sitting directly
    // between them. That's deliberate — see the comment on TIMELINE_LEG_MIN_WIDTH.
    // Grouping a stop with its connector in one flex-1 wrapper (the old
    // approach) let a stop with no connector next to it — like the very first
    // one — inherit growth it had nowhere to spend, which is what produced
    // the oversized gap after the origin stop.
    <div className="relative mt-4 -mx-1 overflow-x-auto px-1 [scrollbar-width:thin]">
      <div className="flex w-full items-start">
        <TimelineStopNode
          code={stops[0].code}
          time={stops[0].time}
          isJunction={stops[0].kind === "junction"}
          dayOffset={dayOffsets[0]}
        />
        {journey.legs.map((leg, i) => {
          const stop = stops[i + 1];
          return (
            <div key={`${stop.code}-${i}`} className="contents">
              <TimelineLegConnector leg={leg} />
              <TimelineStopNode
                code={stop.code}
                time={stop.time}
                isJunction={stop.kind === "junction"}
                dayOffset={dayOffsets[i + 1]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segment card — one leg's own detail card, shown when expanded        */
/* ------------------------------------------------------------------ */

export function SegmentCard({ leg }: { leg: AnnotatedLeg }) {
  const Icon = MODE_ICON[leg.mode];

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-violet-soft px-2 py-1 font-mono text-[11px] font-bold text-violet-dark">
          <Icon size={13} />#{leg.trainNo || leg.mode.toUpperCase()}
        </span>
        <AvailabilityPill leg={leg} />
      </div>

      <div className="min-w-0">
        <p className="truncate font-display text-[13.5px] font-semibold text-ink">
          {leg.trainName}
        </p>
        <p className="font-mono text-[11.5px] text-ink-muted">
          {leg.from} → {leg.to}
        </p>
      </div>

      {leg.fare !== null && (
        <p className="font-display text-[13px] font-semibold text-violet">
          ₹{leg.fare}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex shrink-0 flex-col items-start leading-tight">
          <span className="font-display text-[13px] font-semibold text-ink">
            {leg.departure}
          </span>
          <span className="font-mono text-[10.5px] text-ink-dim">
            {leg.from}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
          <span className="whitespace-nowrap font-mono text-[9.5px] text-ink-dim">
            {formatTravelTime(leg.travelTime)}
          </span>
          <span className="h-px w-full bg-border" />
        </div>
        <div className="flex shrink-0 flex-col items-end leading-tight">
          <span className="font-display text-[13px] font-semibold text-ink">
            {leg.arrival}
          </span>
          <span className="font-mono text-[10.5px] text-ink-dim">{leg.to}</span>
        </div>
      </div>
      <a
        href={`${leg.bookingUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex p-2 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 font-display text-sm font-semibold text-violet! border border-violet shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] sm:flex-none"
      >
        Book Now <MoveUpRight size={16} />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Journey card                                                         */
/* ------------------------------------------------------------------ */

export default function JourneyCard({
  journey,
  tag,
  rank,
}: {
  journey: AnnotatedJourney;
  tag?: string;
  /** Optional 1-based position in the results list — renders the numbered badge from the reference design. Pass `rank={i + 1}` from wherever this is mapped over a list. */
  rank?: number;
}) {
  const isBest = tag === BEST_OVERALL_TAG;
  const [showMap, setShowMap] = useState(false);
  const [expanded, setExpanded] = useState(true);
  return (
    <div
      className={`group relative w-full min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isBest
          ? "border-violet-ring shadow-violet-soft/50 ring-1 ring-violet-ring"
          : "border-border"
      }`}
    >
      {isBest && (
        <div className="h-1 w-full bg-gradient-to-r from-violet via-violet-dark to-violet" />
      )}

      <div
        className={`min-w-0 p-4 sm:p-5 ${isBest ? "bg-gradient-to-br from-violet-soft/30 to-white" : ""}`}
      >
        {/* Header: rank + tag + stat pills + View path */}
        <div className="flex flex-wrap items-center gap-2">
          {rank !== undefined && (
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-bold ${tagStyle(tag)}`}
            >
              {rank}
            </span>
          )}

          {tag && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wide ${tagStyle(tag)}`}
            >
              {tagDisplay(tag)}
            </span>
          )}

          {journey.totalFare !== null && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] font-semibold text-ink shadow-sm">
              <WalletIcon className="h-3.5 w-3.5 text-violet" />₹
              {journey.totalFare}
            </span>
          )}

          <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] text-ink-muted shadow-sm">
            <ClockIcon className="h-3.5 w-3.5 text-violet" />
            {durationLabel(journey.totalDurationMin)}
          </span>

          <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[11.5px] text-ink-muted shadow-sm">
            <JunctionIcon className="h-3.5 w-3.5 text-violet" />
            {journey.connections === 0
              ? "direct"
              : `${journey.connections} connection${journey.connections > 1 ? "s" : ""}`}
          </span>

          {(journey.hub || journey.hub2) && (
            <Badge>
              via{" "}
              {[journey.hub, journey.hub2, journey.hub3]
                .filter(Boolean)
                .join(" → ")}
            </Badge>
          )}

          {journey.modesUsed.length > 1 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 shadow-sm">
              {journey.legs.map((leg, i) => {
                const Icon = MODE_ICON[leg.mode];
                return (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-[10px] text-ink-dim">→</span>
                    )}
                    <Icon className="h-3.5 w-3.5 text-violet" size={14} />
                  </span>
                );
              })}
            </span>
          )}

          <StatusBadge
            fullyConfirmed={journey.fullyConfirmed}
            hasBlockedLeg={journey.hasBlockedLeg}
          />

          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-ink-muted shadow-sm transition-colors hover:border-violet-ring hover:text-violet"
          >
            {showMap ? "Hide path" : "View path"}
            <ChevronDownIcon
              className={`h-3 w-3 transition-transform ${showMap ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Route timeline */}
        <RouteTimeline journey={journey} />

        {showMap && <RouteMap legs={journey.legs} />}

        {/* Segment count toggle + View details, then the expanded grid */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {journey.legs.length} segment{journey.legs.length > 1 ? "s" : ""}
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 font-display text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            {expanded ? "Hide details" : "View details"}
            <ArrowRight
              size={14}
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        </div>

        {expanded && (
          <div
            className={`mt-3 grid gap-3 ${
              journey.legs.length === 1
                ? "grid-cols-1"
                : journey.legs.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {journey.legs.map((leg, i) => (
              <SegmentCard key={i} leg={leg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
