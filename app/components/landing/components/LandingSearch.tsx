"use client";

import React, { useMemo, useState } from "react";
import JourneySearchButton from "../../JourneySearchButton";
import JourneyStopsForm, { StopEntry } from "../../JourneyStopsForm";
import { todayIso } from "@/lib/date";
import type { TripLeg } from "@/app/types";

// The hero only ever asks for the three things every trip needs — where
// from, where to, and when — plus an optional chain of further stops.
// Class, quota, and everything else train-specific live as filters on the
// journey planner once real results are on screen, so this box stays valid
// however many modes (train/bus/flight) end up behind it.
const glassLabel = "font-display text-[12px] text-ink/70";
const glassInput =
  "w-full bg-transparent p-0 font-semibold text-[14px] text-ink outline-none placeholder:text-ink/40 placeholder:font-normal";

const LandingSearch = () => {
  const [origin, setOrigin] = useState("NDLS");
  const [stops, setStops] = useState<StopEntry[]>([{ id: "hero-leg-0", to: "BCT", date: todayIso() }]);
  const [touched, setTouched] = useState(false);

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
    <div className="p-5 rounded-2xl bg-gradient-to-r from-white/40 via-white/55 to-white/70 p-4 shadow-xs backdrop-blur-xs">
      <JourneyStopsForm
        idPrefix="hero"
        origin={origin}
        onOriginChange={setOrigin}
        stops={stops}
        onStopsChange={setStops}
        labelClassName={glassLabel}
        inputClassName={glassInput}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {touched && invalid && (
          <p className="font-mono text-[11px] text-signal-red sm:mr-auto">
            {multi ? "Check every stop has a station and a date, and no two stations in a row match." : "Pick two different stations to search."}
          </p>
        )}
        <JourneySearchButton
          from={multi ? undefined : legs[0]?.from}
          to={multi ? undefined : legs[0]?.to}
          date={multi ? undefined : legs[0]?.date}
          legs={multi ? legs : undefined}
          size="lg"
          className="w-full sm:w-auto"
          label={multi ? `Search ${legs.length}-stop trip` : "Search trains"}
          disabled={invalid && touched}
          onBeforeNavigate={() => {
            setTouched(true);
            if (invalid) return false;
          }}
        />
      </div>
    </div>
  );
};

export default LandingSearch;