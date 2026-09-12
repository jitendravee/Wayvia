"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  BusFront,
  MoveUpRight,
  Plane,
  Sparkles,
  TrainFront,
} from "lucide-react";
import type { AnnotatedJourney, AnnotatedLeg, Mode } from "../types";
import { Badge, StatusBadge } from "./Badge";
import { durationLabel } from "./status";
import { ChevronDownIcon, ClockIcon, JunctionIcon, WalletIcon } from "./Icons";
import JourneyShareButton from "./JourneyShareButton";
import { getStationCityName, getCrossStationTransfer } from "@/lib/geo";
import { getLegBookingOptions } from "@/lib/bookingLinks";

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
  name,
  time,
  isJunction,
  dayOffset,
  layoverMin,
}: {
  code: string;
  name?: string;
  time: string;
  isJunction: boolean;
  dayOffset: number;
  layoverMin?: number;
}) {
  const cityName = name
    ? name
        .replace(/\b(JN|JUNCTION|TERMINUS|TERMINAL|CANTT|CENTRAL|MAIN)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
    : getStationCityName(code);

  return (
    <div
      className={`flex ${TIMELINE_NODE_WIDTH} shrink-0 flex-col items-center gap-0.5 px-1 text-center`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-violet bg-white" />
      <span className="font-display text-[13px] font-semibold leading-tight text-ink">
        {code}
      </span>
      <span
        className="max-w-[72px] truncate font-sans text-[10px] font-medium leading-tight text-ink-muted"
        title={cityName}
      >
        {cityName}
      </span>
      <span className="whitespace-nowrap font-mono text-[10.5px] leading-tight text-ink-dim">
        {time}
        {dayOffset > 0 && (
          <span className="text-violet font-semibold"> +{dayOffset}d</span>
        )}
      </span>
      {isJunction && layoverMin !== undefined ? (
        <span
          className={`mt-0.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[9px] font-semibold ${
            layoverMin < 35
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : layoverMin > 180
                ? "bg-slate-100 text-slate-700 border border-slate-300"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }`}
          title={`Transfer buffer at this station: ${durationLabel(layoverMin)}`}
        >
          {layoverMin < 35 ? "⚠️" : "⏱️"} {layoverMin}m
        </span>
      ) : (
        <span className="font-mono text-[9.5px] uppercase leading-tight tracking-wide text-ink-dim">
          {isJunction ? "Junction" : "\u00A0"}
        </span>
      )}
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
    <div className="relative mt-4 -mx-1 overflow-x-auto px-1 [scrollbar-width:thin]">
      <div className="flex w-full items-start">
        <TimelineStopNode
          code={stops[0].code}
          name={stops[0].name}
          time={stops[0].time}
          isJunction={stops[0].kind === "junction"}
          dayOffset={dayOffsets[0]}
        />
        {journey.legs.map((leg, i) => {
          const stop = stops[i + 1];
          const isJunction = stop.kind === "junction";
          const layoverMin =
            isJunction && journey.gapsMin && i < journey.gapsMin.length
              ? journey.gapsMin[i]
              : undefined;

          return (
            <div key={`${stop.code}-${i}`} className="contents">
              <TimelineLegConnector leg={leg} />
              <TimelineStopNode
                code={stop.code}
                name={stop.name}
                time={stop.time}
                isJunction={isJunction}
                dayOffset={dayOffsets[i + 1]}
                layoverMin={layoverMin}
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

export function SegmentCard({
  leg,
  travelDate,
}: {
  leg: AnnotatedLeg;
  travelDate?: string;
}) {
  const Icon = MODE_ICON[leg.mode];
  const bookingOptions = getLegBookingOptions(leg, travelDate);
  const primaryOption =
    bookingOptions.find((o) => o.isPrimary) || bookingOptions[0];

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
          {leg.from} ({getStationCityName(leg.from)}) → {leg.to} (
          {getStationCityName(leg.to)})
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

      {/* Primary Booking Button & Secondary Provider Options */}
      <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-border-soft">
        <a
          href={primaryOption.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-4 py-2 font-display text-[13px] font-semibold text-white! shadow-sm shadow-violet-soft transition-transform hover:bg-violet-dark hover:scale-[1.01] active:scale-[0.99]"
        >
          Book on {primaryOption.name}
          <MoveUpRight size={14} />
        </a>

        {bookingOptions.length > 1 && (
          <div className="flex items-center justify-between px-0.5 pt-0.5">
            <span className="text-[10px] text-ink-dim font-mono">Also on:</span>
            <div className="flex items-center gap-1.5">
              {bookingOptions
                .filter((opt) => opt.id !== primaryOption.id)
                .map((opt) => (
                  <a
                    key={opt.id}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] font-medium text-ink-muted hover:border-violet-ring hover:text-violet transition-colors"
                  >
                    {opt.name}
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
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
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  searchDate,
}: {
  journey: AnnotatedJourney;
  tag?: string;
  /** Optional 1-based position in the results list — renders the numbered badge from the reference design. Pass `rank={i + 1}` from wherever this is mapped over a list. */
  rank?: number;
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  searchDate?: string;
}) {
  const isBest = tag === BEST_OVERALL_TAG;
  const [showMap, setShowMap] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Detect any cross-station transfers within metropolitan clusters (e.g. NDLS to NZM)
  const crossTransfers = useMemo(() => {
    const alerts: { city: string; fromCode: string; toCode: string }[] = [];
    for (let i = 0; i < journey.legs.length - 1; i++) {
      const arr = journey.legs[i].to;
      const dep = journey.legs[i + 1].from;
      const transfer = getCrossStationTransfer(arr, dep);
      if (transfer) {
        alerts.push(transfer);
      }
    }
    return alerts;
  }, [journey.legs]);

  return (
    <div
      id={rank !== undefined ? `journey-card-${rank}` : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative w-full min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg scroll-mt-24 ${
        isHighlighted
          ? "border-blue-500 ring-2 ring-blue-500/40 shadow-md -translate-y-0.5"
          : isBest
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

        {/* Cross-Station Transfer Alert Banner */}
        {crossTransfers.length > 0 && (
          <div className="mt-3.5 flex flex-col gap-2">
            {crossTransfers.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 text-amber-900 shadow-2xs"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-[12px] leading-snug">
                  <span className="font-semibold">
                    Station Transfer Required ({alert.city}):
                  </span>{" "}
                  Arrives at{" "}
                  <span className="font-mono font-bold">{alert.fromCode}</span>{" "}
                  ({getStationCityName(alert.fromCode)}) and departs from{" "}
                  <span className="font-mono font-bold">{alert.toCode}</span> (
                  {getStationCityName(alert.toCode)}). Allow at least 45–60 mins
                  for city road/metro transit.
                </div>
              </div>
            ))}
          </div>
        )}

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

          <div className="flex items-center gap-2">
            <JourneyShareButton journey={journey} searchDate={searchDate} />

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-violet px-3.5 py-1.5 font-display text-[12px] font-semibold text-white transition-colors hover:bg-violet-dark sm:px-4 sm:py-2 sm:text-[12.5px]"
            >
              {expanded ? "Hide details" : "View details"}
              <ArrowRight
                size={14}
                className={`transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          </div>
        </div>

        {expanded && (
          <>
            {/* Step-by-Step Multi-leg Booking Guide Strip */}
            {journey.legs.length > 1 && (
              <div className="mt-3.5 rounded-xl border border-violet/20 bg-gradient-to-r from-violet-soft/30 via-white to-violet-soft/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-[12px] font-bold text-violet-dark flex items-center gap-1.5">
                    <Sparkles size={13} className="text-violet" /> Multimodal
                    Booking Guide ({journey.legs.length} Steps)
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-muted">
                    Book each leg in order
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {journey.legs.map((leg, idx) => {
                    const opt = getLegBookingOptions(leg, searchDate)[0];
                    return (
                      <div
                        key={idx}
                        className="flex flex-1 items-center justify-between gap-2 rounded-lg border border-border/80 bg-white px-3 py-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-[11px] font-bold text-ink">
                            Step {idx + 1}: #
                            {leg.trainNo || leg.mode.toUpperCase()}
                          </p>
                          <p className="truncate font-mono text-[10px] text-ink-muted">
                            {leg.from} ➔ {leg.to} ({leg.departure})
                          </p>
                        </div>
                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 rounded-md bg-violet/10 hover:bg-violet hover:text-white px-2 py-1 font-mono text-[10.5px] font-semibold text-violet transition-colors"
                        >
                          Book <MoveUpRight size={11} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                <SegmentCard key={i} leg={leg} travelDate={searchDate} />
              ))}
            </div>

            {/* WhatsApp Itinerary Generator Banner */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 p-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                  >
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.954-1.399A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.604 0-3.089-.472-4.337-1.282l-.31-.202-2.92.766.779-2.846-.222-.353A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167s8.167 3.664 8.167 8.167-3.664 8.167-8.167 8.167z" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-[12.5px] font-bold text-emerald-950">
                    Send Itinerary on WhatsApp
                  </p>
                  <p className="font-mono text-[10.5px] text-emerald-800/80">
                    Timings, seat availability, train numbers & interactive
                    preview link
                  </p>
                </div>
              </div>
              <JourneyShareButton
                journey={journey}
                searchDate={searchDate}
                variant="prominent"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
