"use client";

import { useMemo } from "react";
import { Bus, Plane, TrainFront } from "lucide-react";
import JourneyStopsForm, { StopEntry } from "./JourneyStopsForm";
import { CalendarIcon, JunctionIcon, SlidersIcon } from "./Icons";
import type { Mode, TripLeg } from "../types";

export interface SearchFormValues {
  from: string;
  to: string;
  date: string;
  /**
   * Not shown in this form on purpose. Class/quota are train-specific
   * refinements, not part of the base "where + when" search — they're
   * surfaced on FiltersBar instead, once results exist, so this box stays
   * mode-agnostic as bus/flight get added. Kept here (with sane defaults)
   * because the search API still needs *some* class/quota to price fares.
   */
  travelClass: string;
  quota: string;
  maxHubs: number;
  /**
   * How many via-junctions (interchange stations) the search is allowed to go
   * through — 1, 2, or 3. This is the "time budget" dial: someone in a hurry
   * keeps it at 1 (direct + a single change); someone flexible on time can
   * push it to 3 to unlock routes that need two extra changes to complete.
   */
  maxConnections: 1 | 2 | 3;
  /**
   * Which mode(s) to actually search — this reaches the backend as
   * /api/search's `modes` param and decides what gets fetched at all
   * (unlike app/components/ModeSelector.tsx's after-the-fact display
   * filter, which only hides results already in hand). All three selected
   * means "search everything" — same as omitting the param entirely.
   */
  modes: Mode[];
}

export const ALL_SEARCH_MODES: Mode[] = ["train", "bus", "flight"];

const MODE_TOGGLES: { value: Mode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "train", label: "Train", icon: TrainFront },
  { value: "bus", label: "Bus", icon: Bus },
  { value: "flight", label: "Flight", icon: Plane },
];

/** Train/bus/flight toggle row — controls what the backend actually searches for, not just what's shown afterwards. At least one mode must stay selected. */
function SearchModesField({ value, onChange }: { value: Mode[]; onChange: (v: Mode[]) => void }) {
  function toggle(m: Mode) {
    if (value.includes(m)) {
      if (value.length === 1) return; // never let every mode get deselected
      onChange(value.filter((v) => v !== m));
    } else {
      onChange([...value, m]);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-alt/60 p-3.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Search for</span>
      <div className="flex flex-wrap gap-1.5">
        {MODE_TOGGLES.map(({ value: m, label, icon: Icon }) => {
          const active = value.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              aria-pressed={active}
              className={
                active
                  ? "flex items-center gap-1.5 rounded-full border border-violet bg-violet px-3 py-1.5 font-display text-[12.5px] font-semibold text-white"
                  : "flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 font-display text-[12.5px] text-ink-muted transition-colors hover:border-violet-ring hover:text-ink"
              }
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[10.5px] leading-relaxed text-ink-dim">
        {value.length === ALL_SEARCH_MODES.length
          ? "Searching every mode we can — trains live from erail.in, bus & flight from demo data for now."
          : `Only searching ${value.join(" + ")} — faster, but you'll miss anything on the other mode${
              ALL_SEARCH_MODES.length - value.length > 1 ? "s" : ""
            }.`}
      </p>
    </div>
  );
}

const MAX_HUBS_CEILING = 60;

const CONNECTIONS_LABEL: Record<1 | 2 | 3, string> = {
  1: "Fastest search — direct + a single change",
  2: "The usual balance of speed and coverage",
  3: "Slowest search, but finds routes the others miss",
};

interface Props {
  values: SearchFormValues;
  onChange: (values: SearchFormValues) => void;
  /** "Add a stop" chain beyond the base from→to leg above — B→C, C→D, etc. */
  extraStops: StopEntry[];
  onExtraStopsChange: (stops: StopEntry[]) => void;
  /** Single-leg submit — fired when there are no extra stops. */
  onSubmit: () => void;
  /** Multi-city submit — fired instead of onSubmit whenever 1+ extra stops are present. */
  onSubmitMulti: (legs: TripLeg[]) => void;
  loading: boolean;
}

/** Shared slider look — a filled track drawn under a transparent native range input, so both sliders line up pixel-for-pixel. */
function RangeField({
  id,
  icon,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueLabel,
  hint,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  valueLabel: string;
  hint: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-alt/60 p-3.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <span className="text-violet">{icon}</span>
          {label}
        </label>
        <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">{valueLabel}</span>
      </div>

      <div className="relative flex h-5 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-[6px] rounded-full bg-border" />
        <div
          className="pointer-events-none absolute left-0 h-[6px] rounded-full bg-gradient-to-r from-violet to-violet-dark transition-[width]"
          style={{ width: `${pct}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:h-[6px] [&::-moz-range-track]:bg-transparent
            [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:bg-violet [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:bg-violet [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      <p className="font-mono text-[10.5px] leading-relaxed text-ink-dim">{hint}</p>
    </div>
  );
}

export default function SearchForm({ values, onChange, extraStops, onExtraStopsChange, onSubmit, onSubmitMulti, loading }: Props) {
  const set = <K extends keyof SearchFormValues>(key: K, val: SearchFormValues[K]) =>
    onChange({ ...values, [key]: val });

  // Row 0 of the shared stops editor is this form's own from/to/date; any
  // extra rows chain onward from it (B→C, C→D, ...). Keeping them as one
  // list here (like the hero does) means single-leg and multi-city share
  // the exact same editing UI.
  const stopsForEditor: StopEntry[] = useMemo(
    () => [{ id: "base", to: values.to, date: values.date }, ...extraStops],
    [values.to, values.date, extraStops]
  );

  function handleStopsChange(next: StopEntry[]) {
    const [base, ...rest] = next;
    onChange({ ...values, to: base.to, date: base.date });
    onExtraStopsChange(rest);
  }

  const legs: TripLeg[] = useMemo(() => {
    const chain = [values.from, ...stopsForEditor.map((s) => s.to)];
    return stopsForEditor.map((s, i) => ({ from: chain[i], to: chain[i + 1], date: s.date }));
  }, [values.from, stopsForEditor]);

  const multi = extraStops.length > 0;
  const invalid = legs.some(
    (l) => !l.from.trim() || !l.to.trim() || !l.date.trim() || l.from.trim().toUpperCase() === l.to.trim().toUpperCase()
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    if (multi) onSubmitMulti(legs);
    else onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-violet-soft/40"
    >
      <div className="border-b border-border-soft bg-gradient-to-r from-violet-soft/50 via-white to-white px-5 py-4">
        <JourneyStopsForm
          idPrefix="planner"
          origin={values.from}
          onOriginChange={(code) => set("from", code)}
          stops={stopsForEditor}
          onStopsChange={handleStopsChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 px-5 py-4 sm:grid-cols-3">
        <div className="hidden sm:col-span-2 sm:flex sm:items-center">
          <p className="flex items-center gap-1.5 font-mono text-[10.5px] leading-relaxed text-ink-dim">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-violet" />
            {multi
              ? `${legs.length} legs — each priced and searched on its own date.`
              : "Class & quota now live in the filters below — change them any time without retyping your route."}
          </p>
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="submit"
            disabled={loading || invalid}
            className="flex h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-violet-dark font-display text-sm font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Searching…
              </>
            ) : multi ? (
              `Find my ${legs.length}-stop trip`
            ) : (
              "Find my journey"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 border-t border-border-soft bg-surface-alt/30 px-5 py-4 sm:grid-cols-3">
        <SearchModesField value={values.modes} onChange={(v) => set("modes", v)} />

        <RangeField
          id="hubs"
          icon={<SlidersIcon className="h-3.5 w-3.5" />}
          label="Junctions to explore"
          value={values.maxHubs}
          min={3}
          max={MAX_HUBS_CEILING}
          onChange={(v) => set("maxHubs", v)}
          valueLabel={values.maxHubs >= MAX_HUBS_CEILING ? `${values.maxHubs} (max)` : String(values.maxHubs)}
          hint="Pulled live from erail.in's station directory — more here means genuinely more junctions get checked."
        />

        <RangeField
          id="connections"
          icon={<JunctionIcon className="h-3.5 w-3.5" />}
          label="Via-junctions allowed"
          value={values.maxConnections}
          min={1}
          max={3}
          onChange={(v) => set("maxConnections", v as 1 | 2 | 3)}
          valueLabel={`${values.maxConnections} ${values.maxConnections === 1 ? "junction" : "junctions"}`}
          hint={`${CONNECTIONS_LABEL[values.maxConnections]}. If a search comes back thin, we'll suggest raising this ourselves.`}
        />
      </div>
    </form>
  );
}