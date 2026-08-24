"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  MoreHorizontal,
  Plane,
  Plus,
  TrainFront,
} from "lucide-react";
import JourneySearchButton from "../../JourneySearchButton";
import JourneyStopsForm, { StopEntry } from "../../JourneyStopsForm";
import { todayIso } from "@/lib/date";
import type { TripLeg } from "@/app/types";

// The hero only ever asks for the three things every trip needs — where
// from, where to, and when — plus an optional chain of further stops.
// Class, quota, and everything else train-specific live as filters on the
// journey planner once real results are on screen, so this box stays valid
// however many modes (train/bus/flight) end up behind it.
const glassLabel = "font-sans text-[11.5px] text-ink/45";
const glassInput =
  "w-full bg-transparent p-0 font-display font-semibold text-[15px] text-ink outline-none placeholder:text-ink/35 placeholder:font-normal";

type Mode = "train" | "bus" | "flight" | "more";

const MODES: {
  id: Mode;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}[] = [
  { id: "train", label: "Trains", icon: TrainFront, enabled: true },
  { id: "bus", label: "Buses", icon: Bus, enabled: false },
  { id: "flight", label: "Flights", icon: Plane, enabled: false },
  { id: "more", label: "More", icon: MoreHorizontal, enabled: false },
];

const LandingSearch = () => {
  const [origin, setOrigin] = useState("NDLS");
  const [stops, setStops] = useState<StopEntry[]>([
    { id: "hero-leg-0", to: "BCT", date: todayIso() },
  ]);
  const [touched, setTouched] = useState(false);
  const [mode, setMode] = useState<Mode>("train");

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
    (l) =>
      !l.from.trim() ||
      !l.to.trim() ||
      !l.date.trim() ||
      l.from.trim().toUpperCase() === l.to.trim().toUpperCase(),
  );

  return (
    <div className="flex flex-col gap-2.5 ">
      {/* Search card — From / To / Date, with the CTA inline on wide screens */}
      <div className="rounded-2xl bg-gradient-to-br from-white/30 via-white/40 to-white/70 p-2.5 shadow-sm shadow-ink/10 backdrop-blur-xs sm:p-6 sm:pt-4">
  {/* Top action */}
  <div className="mb-3 flex justify-end">
    {!multi && (
      <button
        type="button"
        onClick={() => {
          if (stops.length < 6) {
            setStops([
              ...stops,
              {
                id: `hero-leg-${Date.now()}`,
                to: "",
                date: stops[stops.length - 1]?.date ?? todayIso(),
              },
            ]);
          }
        }}
        className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-violet transition-opacity hover:opacity-70"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add a stop
      </button>
    )}
  </div>

  {/* Search fields */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
    <div className="min-w-0 flex-1">
      <JourneyStopsForm
        idPrefix="hero"
        origin={origin}
        onOriginChange={setOrigin}
        stops={stops}
        onStopsChange={setStops}
        labelClassName={glassLabel}
        inputClassName={glassInput}
      />
    </div>

    {!multi && (
      <JourneySearchButton
        from={legs[0]?.from}
        to={legs[0]?.to}
        date={legs[0]?.date}
        size="lg"
        className=" w-full shrink-0 sm:w-auto"
        label="Find a Way"
        icon={<ArrowRight size={17} />}
        disabled={invalid && touched}
        onBeforeNavigate={() => {
          setTouched(true);
          if (invalid) return false;
        }}
      />
    )}
  </div>

  {/* Multi-stop search */}
  {multi && (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      {touched && invalid && (
        <p className="font-sans text-[11px] text-signal-red sm:mr-auto">
          Check every stop has a station and a date, and no two stations
          in a row match.
        </p>
      )}

      <JourneySearchButton
        legs={legs}
        size="lg"
        className="w-full sm:w-auto"
        label={`Search ${legs.length}-stop trip`}
        icon={<ArrowRight size={17} />}
        disabled={invalid && touched}
        onBeforeNavigate={() => {
          setTouched(true);
          if (invalid) return false;
        }}
      />
    </div>
  )}

  {!multi && touched && invalid && (
    <p className="mt-2 font-sans text-[11px] text-signal-red">
      Pick two different stations to search.
    </p>
  )}
</div>

      {/* Mode tabs — only Trains is live today; the rest are staged for later */}
      <div className="flex items-center justify-center gap-1 rounded-full bg-white/90 px-2 py-1.5 shadow-md shadow-ink/5 backdrop-blur-sm sm:justify-start sm:px-3">
        {MODES.map((m, i) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <React.Fragment key={m.id}>
              {i > 0 && <span className="select-none px-1 text-ink/15">•</span>}
              <button
                type="button"
                onClick={() => m.enabled && setMode(m.id)}
                disabled={!m.enabled}
                title={m.enabled ? undefined : "Coming soon"}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-sans text-[13px] transition-colors ${
                  active
                    ? "font-semibold text-ink"
                    : m.enabled
                      ? "text-ink-muted hover:text-ink"
                      : "text-ink/30 cursor-not-allowed"
                }`}
              >
                <Icon size={15} />
                {m.label}
                {!m.enabled && (
                  <span className="rounded-full bg-violet-soft/70 px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wide text-violet-dark/70">
                    Soon
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LandingSearch;
