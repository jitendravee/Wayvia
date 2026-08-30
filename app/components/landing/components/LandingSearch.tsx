"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BusFront,
  MoreHorizontal,
  Plane,
  TrainFront,
} from "lucide-react";
import JourneySearchButton from "../../JourneySearchButton";
import JourneyStopsForm, { StopEntry } from "../../JourneyStopsForm";
import { todayIso } from "@/lib/date";
import type { TripLeg } from "@/app/types";
import { useResolvedPlace } from "@/lib/query/resolvedPlace";

// The hero only ever asks for the three things every trip needs — where
// from, where to, and when — plus an optional chain of further stops.
// Class, quota, and everything else train-specific live as filters on the
// journey planner once real results are on screen, so this box stays valid
// however many modes (train/bus/flight) end up behind it.
const glassLabel =
  "font-sans text-[10.5px] uppercase tracking-wide text-ink/45 sm:text-[11px]";
const glassInput =
  "w-full bg-transparent p-0 font-display font-semibold text-[15px] text-ink outline-none placeholder:text-ink/35 placeholder:font-normal sm:text-[16px]";
const glassCaption =
  "font-sans text-[11.5px] leading-none text-ink/45 truncate sm:text-[12px]";

type Mode = "train" | "bus" | "flight" | "more";

const MODES: {
  id: Mode;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}[] = [
  { id: "train", label: "Trains", icon: TrainFront, enabled: true },
  { id: "bus", label: "Buses", icon: BusFront, enabled: true },
  { id: "flight", label: "Flights", icon: Plane, enabled: false },
  { id: "more", label: "More", icon: MoreHorizontal, enabled: true },
];

const LandingSearch = () => {
  // Default values as place IDs
  const [origin, setOrigin] = useState("New Delhi"); // New Delhi
  const [stops, setStops] = useState<StopEntry[]>([
    { id: "hero-leg-0", to: "Mumbai", date: todayIso() },
  ]); // Mumbai
  const [touched, setTouched] = useState(false);
  const [mode, setMode] = useState<Mode>("train");

  // Resolve place names for display
  const { data: originPlace } = useResolvedPlace(origin);
  const { data: destinationPlace } = useResolvedPlace(stops[0]?.to ?? "");

  const multi = stops.length > 1;

  // stops[0] is always the base A→B search; anything after it chains from
  // the previous stop's destination — e.g. [B, C, D] with origin A becomes
  // legs A→B, B→C, C→D.
  const legs: TripLeg[] = useMemo(() => {
    const chain = [origin, ...stops.map((s) => s.to)];
    return stops.map((s, i) => ({
      from: chain[i],
      to: chain[i + 1],
      date: s.date,
    }));
  }, [origin, stops]);

  const invalid = legs.some(
    (l) => !l.from || !l.to || !l.date || l.from === l.to,
  );

  // Rendered twice by JourneyStopsForm (inline on desktop, its own full-width
  // row on mobile) — CSS hides whichever slot doesn't apply, so the click
  // handling and validation only need to live in one place.
  const searchButton = (
    <JourneySearchButton
      from={multi ? undefined : legs[0]?.from}
      to={multi ? undefined : legs[0]?.to}
      date={multi ? undefined : legs[0]?.date}
      legs={multi ? legs : undefined}
      transport={mode === "more" ? undefined : mode}
      size="lg"
      className="w-full shrink-0 sm:w-auto"
      label={multi ? `Search ${legs.length}-stop trip` : "Find a Way"}
      icon={<ArrowRight size={17} />}
      disabled={invalid && touched}
      onBeforeNavigate={() => {
        setTouched(true);
        if (invalid) return false;
      }}
    />
  );
  return (
    <div className="flex flex-col gap-2.5 max-w-[800px] sm:gap-3">
      {/* One card: search fields + CTA, "Add a stop", and the mode switcher all live together */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 via-white/70 to-white/80 shadow-lg shadow-ink/10 backdrop-blur-sm">
        <div className="p-3.5 sm:p-4 md:p-5">
          <JourneyStopsForm
            idPrefix="hero"
            origin={origin}
            onOriginChange={setOrigin}
            stops={stops}
            onStopsChange={setStops}
            labelClassName={glassLabel}
            inputClassName={glassInput}
            captionClassName={glassCaption}
            searchButton={searchButton}
          />

          {touched && invalid && (
            <p className="mt-2 font-sans text-[11px] text-signal-red">
              {multi
                ? "Check every stop has a station and a date, and no two stations in a row match."
                : "Pick two different stations to search."}
            </p>
          )}
        </div>

        {/* Mode tabs — only Trains is live today; the rest are staged for later.
            Icons stack above the label on phones, sit inline with it from `sm` up. */}
        <div className="flex items-stretch gap-1 border-t border-ink/10 bg-white/40 px-2 py-1.5 sm:gap-1.5 sm:px-4 sm:py-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => m.enabled && setMode(m.id)}
                disabled={!m.enabled}
                title={m.enabled ? undefined : "Coming soon"}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 font-sans text-[11px] whitespace-nowrap transition-colors sm:flex-none sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:text-[13.5px] ${
                  active
                    ? "font-semibold text-ink"
                    : m.enabled
                      ? "text-ink-muted hover:text-ink"
                      : "text-ink/35 cursor-not-allowed"
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 sm:size-4 ${active ? "text-violet" : ""}`}
                />
                <span className="truncate">{m.label}</span>
                {!m.enabled && (
                  <span className="hidden shrink-0 rounded-full bg-violet-soft px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wide text-violet sm:inline-flex">
                    Soon
                  </span>
                )}
                {active && (
                  <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-violet sm:left-1.5 sm:right-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingSearch;
