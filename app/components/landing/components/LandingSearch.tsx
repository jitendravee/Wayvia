"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Bus, MoreHorizontal, Plane, TrainFront } from "lucide-react";
import JourneySearchButton from "../../JourneySearchButton";
import JourneyStopsForm, { StopEntry } from "../../JourneyStopsForm";
import { todayIso } from "@/lib/date";
import type { TripLeg } from "@/app/types";

// The hero only ever asks for the three things every trip needs — where
// from, where to, and when — plus an optional chain of further stops.
// Class, quota, and everything else train-specific live as filters on the
// journey planner once real results are on screen, so this box stays valid
// however many modes (train/bus/flight) end up behind it.
const glassLabel = "font-sans text-[10.5px] text-ink/50 sm:text-[12px]";
const glassInput =
  "w-full bg-transparent p-0 font-display font-semibold text-[14px] text-ink outline-none placeholder:text-ink/35 placeholder:font-normal sm:text-[16px]";
const glassCaption = "font-sans text-[11px] leading-none text-ink/50 truncate sm:text-[12.5px]";

type Mode = "train" | "bus" | "flight" | "more";

const MODES: { id: Mode; label: string; icon: React.ElementType; enabled: boolean }[] = [
  { id: "train", label: "Trains", icon: TrainFront, enabled: true },
  { id: "bus", label: "Buses", icon: Bus, enabled: false },
  { id: "flight", label: "Flights", icon: Plane, enabled: false },
  { id: "more", label: "More", icon: MoreHorizontal, enabled: false },
];

const LandingSearch = () => {
  const [origin, setOrigin] = useState("NDLS");
  const [stops, setStops] = useState<StopEntry[]>([{ id: "hero-leg-0", to: "BCT", date: todayIso() }]);
  const [touched, setTouched] = useState(false);
  const [mode, setMode] = useState<Mode>("train");

  const multi = stops.length > 1;

  // stops[0] is always the base A→B search; anything after it chains from
  // the previous stop's destination — e.g. [B, C, D] with origin A becomes
  // legs A→B, B→C, C→D.
  const legs: TripLeg[] = useMemo(() => {
    const chain = [origin, ...stops.map((s) => s.to)];
    return stops.map((s, i) => ({ from: chain[i], to: chain[i + 1], date: s.date }));
  }, [origin, stops]);

  const invalid = legs.some(
    (l) => !l.from.trim() || !l.to.trim() || !l.date.trim() || l.from.trim().toUpperCase() === l.to.trim().toUpperCase()
  );

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[800px] ">
      {/* Search card — From / To / Date, chained stops, CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-white/60 via-white/70 to-white/80 p-3.5 shadow-lg shadow-ink/10 backdrop-blur-sm sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <JourneyStopsForm
              idPrefix="hero"
              origin={origin}
              onOriginChange={setOrigin}
              stops={stops}
              onStopsChange={setStops}
              labelClassName={glassLabel}
              inputClassName={glassInput}
              captionClassName={glassCaption}
            />
          </div>

          <JourneySearchButton
            from={multi ? undefined : legs[0]?.from}
            to={multi ? undefined : legs[0]?.to}
            date={multi ? undefined : legs[0]?.date}
            legs={multi ? legs : undefined}
            size="lg"
            className="w-full shrink-0 self-stretch sm:w-auto sm:self-start"
            label={multi ? `Search ${legs.length}-stop trip` : "Find a Way"}
            icon={<ArrowRight size={17} />}
            disabled={invalid && touched}
            onBeforeNavigate={() => {
              setTouched(true);
              if (invalid) return false;
            }}
          />
        </div>

        {touched && invalid && (
          <p className="mt-2 font-sans text-[11px] text-signal-red">
            {multi
              ? "Check every stop has a station and a date, and no two stations in a row match."
              : "Pick two different stations to search."}
          </p>
        )}
      </div>

      {/* Mode tabs — only Trains is live today; the rest are staged for later.
          Scrolls horizontally instead of wrapping/overflowing on narrow screens. */}
      <div className="flex w-full items-center justify-between gap-0.5 rounded-full bg-linear-to-r from-white/60 via-white/70 to-white/80 px-1.5 py-1.5 shadow-md shadow-ink/5 backdrop-blur-sm sm:w-auto sm:justify-start sm:gap-1 sm:px-3 sm:py-2">
        {MODES.map((m, i) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <React.Fragment key={m.id}>
              {i > 0 && <span className="hidden select-none text-ink/15 sm:inline sm:px-1.5">•</span>}
              <button
                type="button"
                onClick={() => m.enabled && setMode(m.id)}
                disabled={!m.enabled}
                title={m.enabled ? undefined : "Coming soon"}
                className={`relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-1 py-1.5 font-sans text-[11px] whitespace-nowrap transition-colors sm:flex-none sm:gap-1.5 sm:px-2 sm:text-[13.5px] ${
                  active
                    ? "font-semibold text-ink"
                    : m.enabled
                      ? "text-ink-muted hover:text-ink"
                      : "text-ink/35 cursor-not-allowed"
                }`}
              >
                <Icon size={13} className={`shrink-0 sm:size-4 ${active ? "text-violet" : ""}`} />
                <span className="truncate">{m.label}</span>
                {!m.enabled && (
                  <>
                    {/* Compact "soon" indicator on phones — just a dot, no room for a badge */}
                    <span className="h-1 w-1 shrink-0 rounded-full bg-violet sm:hidden" />
                    <span className="hidden shrink-0 rounded-full bg-violet-soft px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wide text-violet sm:inline-flex">
                      Soon
                    </span>
                  </>
                )}
                {active && <span className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 rounded-full bg-violet" />}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LandingSearch;