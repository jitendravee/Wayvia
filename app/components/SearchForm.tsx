"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  LayoutGrid,
  Plane,
  Shuffle,
  TrainFront,
} from "lucide-react";
import type { StopEntry } from "./JourneyStopsForm";
import JourneyStopsForm from "./JourneyStopsForm";
import type { Mode, TripLeg } from "../types";
import { todayIso } from "@/lib/date";
import ModeSelector from "./ModeSelector";
import { FilterState } from "./filters";

export interface SearchFormValues {
  from: string;
  to: string;
  date: string;
  travelClass: string;
  quota: string;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  modes: Mode[];
}

export const ALL_SEARCH_MODES: Mode[] = ["train"];

/* ------------------------------------------------------------------ */
/* Mode chips – unchanged                                             */
/* ------------------------------------------------------------------ */

const MODE_PRESETS: {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  modes: Mode[];
}[] = [
  { key: "all", label: "All Modes", icon: LayoutGrid, modes: ALL_SEARCH_MODES },
  { key: "train", label: "Trains", icon: TrainFront, modes: ["train"] },
  { key: "bus", label: "Buses", icon: Bus, modes: ["bus"] },
  { key: "flight", label: "Flights", icon: Plane, modes: ["flight"] },
  {
    key: "mix",
    label: "Mix (Multimodal)",
    icon: Shuffle,
    modes: ALL_SEARCH_MODES,
  },
];

interface Props {
  values: SearchFormValues;
  onChange: (values: SearchFormValues) => void;

  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;

  extraStops: StopEntry[];
  onExtraStopsChange: (stops: StopEntry[]) => void;
  onSubmit: () => void;
  onSubmitMulti: (legs: TripLeg[]) => void;
  loading: boolean;
}
export default function SearchForm({
  values,
  onChange,
  extraStops,
  onExtraStopsChange,
  onSubmit,
  filters,
  onFiltersChange,
  onSubmitMulti,
  loading,
}: Props) {
  // We'll manage the entire route state through JourneyStopsForm.
  // Keep a local copy that mirrors the values we need.
  const [origin, setOrigin] = useState(values.from);
  const [stops, setStops] = useState<StopEntry[]>(() => {
    // Build the full stops array: first stop is the main destination,
    // followed by any extra stops.
    return [
      { id: "base", to: values.to, date: values.date },
      ...extraStops.map((s) => ({ ...s })), // preserve ids
    ];
  });

  // Sync local state when external values change (e.g., URL params).
  useEffect(() => {
    setOrigin(values.from);
    setStops([
      { id: "base", to: values.to, date: values.date },
      ...extraStops.map((s) => ({ ...s })),
    ]);
  }, [values.from, values.to, values.date, extraStops]);

  // Whenever the route changes inside JourneyStopsForm, update the parent.
  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    onChange({
      ...values,
      from: newOrigin,
    });
  };

  const handleStopsChange = (newStops: StopEntry[]) => {
    setStops(newStops);
    // The first stop holds the main destination and date.
    const first = newStops[0];
    const rest = newStops.slice(1);
    onChange({
      ...values,
      to: first.to,
      date: first.date,
    });
    // Notify parent about extra stops separately if needed.
    onExtraStopsChange(rest);
  };

  /**
   * Atomic swap: origin and stops[0].to both change together in ONE
   * onChange call. Doing this as two separate calls (the old
   * handleOriginChange + handleStopsChange pair) meant both computed their
   * patch from the *same* stale `values` snapshot — the second call's
   * `{...values, to: newTo}` still had the pre-swap `from`, so it silently
   * clobbered the first call's `from` update. Net effect: swapping
   * PUNE→ADI produced PUNE→PUNE instead of ADI→PUNE. Passing this down as
   * `onSwapFirstLeg` short-circuits JourneyStopsForm's default two-call
   * swap and fixes that.
   */
  const handleSwapFirstLeg = (newOrigin: string, newTo: string) => {
    setOrigin(newOrigin);
    setStops((prev) => {
      const next = [...prev];
      next[0] = { ...next[0], to: newTo };
      return next;
    });
    onChange({
      ...values,
      from: newOrigin,
      to: newTo,
    });
  };

  // Build legs for validation and multi‑submit.
  const legs: TripLeg[] = useMemo(() => {
    const chain = [origin, ...stops.map((s) => s.to)];
    return stops.map((s, i) => ({
      from: chain[i],
      to: chain[i + 1],
      date: s.date,
    }));
  }, [origin, stops]);

  const multi = stops.length > 1;
  const invalid = legs.some(
    (l) =>
      !l.from.trim() ||
      !l.to.trim() ||
      !l.date.trim() ||
      l.from.trim().toUpperCase() === l.to.trim().toUpperCase(),
  );

  // Mode chip state.
  const [modePreset, setModePreset] = useState<string>("all");

  useEffect(() => {
    if (values.modes.length === 1) {
      const single = MODE_PRESETS.find(
        (p) => p.modes.length === 1 && p.modes[0] === values.modes[0],
      );
      if (single) setModePreset(single.key);
    }
    if (values.modes.length === ALL_SEARCH_MODES.length) {
      setModePreset((prev) => (prev === "mix" ? prev : "all"));
    }
  }, [values.modes]);

  function selectModePreset(preset: (typeof MODE_PRESETS)[number]) {
    setModePreset(preset.key);
    onChange({ ...values, modes: preset.modes });
  }

  // Submit handler.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    if (multi) onSubmitMulti(legs);
    else onSubmit();
  }

  // Styling for JourneyStopsForm – matches the landing page.
  const glassLabel =
    "font-sans text-[10.5px] uppercase tracking-wide text-ink/45 sm:text-[11px]";
  const glassInput =
    "w-full bg-transparent p-0 font-display font-semibold text-[15px] text-ink outline-none placeholder:text-ink/35 placeholder:font-normal sm:text-[16px]";
  const glassCaption =
    "font-sans text-[11.5px] leading-none text-ink/45 truncate sm:text-[12px]";

  // The search button to be rendered inside JourneyStopsForm (inline on desktop, full‑width on mobile).
  const searchButton = (
    <button
      type="submit"
      disabled={loading || invalid}
      className="flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet to-violet-dark px-5 font-display text-sm font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 sm:flex-none"
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Searching…
        </>
      ) : multi ? (
        `Find my ${legs.length}-stop trip`
      ) : (
        <>
          Find a Way
          <ArrowRight size={15} />
        </>
      )}
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-violet-soft/40"
    >
      {/* The route input – now using the full JourneyStopsForm */}
      <div className="px-4 py-4 sm:px-5">
        <JourneyStopsForm
          idPrefix="search"
          origin={origin}
          onOriginChange={handleOriginChange}
          stops={stops}
          onStopsChange={handleStopsChange}
          onSwapFirstLeg={handleSwapFirstLeg}
          labelClassName={glassLabel}
          inputClassName={glassInput}
          captionClassName={glassCaption}
          searchButton={searchButton}
        />
        {invalid && (
          <p className="mt-2 font-sans text-[11px] text-signal-red">
            {multi
              ? "Check every stop has a station and a date, and no two stations in a row match."
              : "Pick two different stations to search."}
          </p>
        )}
      </div>
    </form>
  );
}