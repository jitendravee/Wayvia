"use client";

import { useMemo } from "react";
import { Bus, LayoutGrid, Plane, RotateCcw, Shuffle, SlidersHorizontal, Sparkles, TrainFront } from "lucide-react";
import {
  ConnectionFilter,
  DEFAULT_FILTERS,
  DepartureWindow,
  DEPARTURE_WINDOW_LABEL,
  FilterState,
  QUOTA_OPTIONS,
  SortKey,
  TransportFilter,
  TRANSPORT_OPTIONS,
  TRAVEL_CLASS_OPTIONS,
} from "./filters";
import { durationLabel } from "./status";
import FilterDropdown from "./FilterDropDown";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  fareCeiling: number;
  durationCeiling: number;
  resultCount: number;
  /** Currently active class/quota — these came from the last /api/search call, not client-side filtering. */
  travelClass: string;
  quota: string;
  /**
   * Unlike every other filter here, class & quota change what fare/seat data
   * even exists — so picking a new one re-queries the backend for this same
   * route+date instead of just re-slicing the results already on screen.
   */
  onRefine: (next: { travelClass?: string; quota?: string }) => void;
  /** True while a class/quota refine request is in flight. */
  refining?: boolean;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "best", label: "Best overall" },
  { key: "cheapest", label: "Cheapest" },
  { key: "fastest", label: "Fastest" },
  { key: "fewestChanges", label: "Fewest changes" },
];

const CONNECTION_OPTIONS: { key: ConnectionFilter; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "direct", label: "Direct only" },
  { key: "oneChange", label: "1 change max" },
  { key: "twoChanges", label: "2 changes max" },
  { key: "threeChanges", label: "3 changes max" },
];

const DEPARTURE_OPTIONS: { key: DepartureWindow; label: string }[] = (
  ["any", "morning", "afternoon", "evening", "night"] as DepartureWindow[]
).map((key) => ({ key, label: DEPARTURE_WINDOW_LABEL[key] }));

const ARRIVAL_OPTIONS = DEPARTURE_OPTIONS;

// filters.transport is a single-select TransportFilter ("any" | Mode |
// "mixed"), not a multi-select list — this icon map is display-only, laid
// over your real TRANSPORT_OPTIONS from filters.ts so the labels/values
// stay whatever that file defines.
const TRANSPORT_ICON: Record<TransportFilter, typeof TrainFront> = {
  any: LayoutGrid,
  train: TrainFront,
  bus: Bus,
  flight: Plane,
  mixed: Shuffle,
};

function formatBudgetLabel(v: number | null, ceiling: number) {
  return `Up to ₹${(v ?? ceiling).toLocaleString("en-IN")}`;
}
function formatDurationLabel(v: number | null, ceiling: number) {
  return v === null ? "Any" : durationLabel(v ?? ceiling);
}

function OptionRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
        active ? "bg-violet-soft text-violet-dark" : "text-ink hover:bg-surface-alt"
      }`}
    >
      <span className="font-display text-[13.5px] font-medium">{label}</span>
    </button>
  );
}

export default function FiltersBar({
  filters,
  onChange,
  fareCeiling,
  durationCeiling,
  resultCount,
  travelClass,
  quota,
  onRefine,
  refining,
}: Props) {
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) => onChange({ ...filters, [key]: val });

  const budgetPresets = useMemo(() => {
    const raw = [1500, 2500, 5000, fareCeiling].filter((p) => p <= fareCeiling && p > 0);
    return Array.from(new Set(raw)).sort((a, b) => a - b);
  }, [fareCeiling]);

  return (
    <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-white px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
      {/* Best match / sort */}
      <FilterDropdown
        label="Best match"
        valueLabel={SORT_OPTIONS.find((s) => s.key === filters.sort)?.label ?? "Best match"}
        variant="pill"
        icon={<Sparkles size={14} />}
        title="Sort by"
      >
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((o) => (
            <OptionRow key={o.key} active={filters.sort === o.key} label={o.label} onClick={() => set("sort", o.key)} />
          ))}
        </div>
      </FilterDropdown>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-border-soft sm:block" />

      {/* Budget */}
      <FilterDropdown
        label="Budget"
        valueLabel={formatBudgetLabel(filters.maxFare, fareCeiling)}
        active={filters.maxFare !== null}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Maximum fare</span>
            <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
              {formatBudgetLabel(filters.maxFare, fareCeiling)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={fareCeiling}
            step={Math.max(1, Math.round(fareCeiling / 50))}
            value={filters.maxFare ?? fareCeiling}
            onChange={(e) => set("maxFare", Number(e.target.value))}
            className="w-full accent-violet"
          />
          <div className="flex flex-wrap gap-1.5">
            {budgetPresets.map((p) => {
              const isCeiling = p === fareCeiling;
              const active = isCeiling ? filters.maxFare === null : filters.maxFare === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("maxFare", isCeiling ? null : p)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                    active ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
                  }`}
                >
                  {isCeiling ? "No limit" : `₹${p.toLocaleString("en-IN")}`}
                </button>
              );
            })}
          </div>
        </div>
      </FilterDropdown>

      {/* Departure */}
      <FilterDropdown
        label="Departure"
        valueLabel={DEPARTURE_WINDOW_LABEL[filters.departure]}
        active={filters.departure !== "any"}
      >
        <div className="flex flex-col gap-1">
          {DEPARTURE_OPTIONS.map((o) => (
            <OptionRow key={o.key} active={filters.departure === o.key} label={o.label} onClick={() => set("departure", o.key)} />
          ))}
        </div>
      </FilterDropdown>

      {/* Arrival */}
      <FilterDropdown
        label="Arrival"
        valueLabel={DEPARTURE_WINDOW_LABEL[filters.arrival]}
        active={filters.arrival !== "any"}
      >
        <div className="flex flex-col gap-1">
          {ARRIVAL_OPTIONS.map((o) => (
            <OptionRow key={o.key} active={filters.arrival === o.key} label={o.label} onClick={() => set("arrival", o.key)} />
          ))}
        </div>
      </FilterDropdown>

      {/* Duration */}
      <FilterDropdown
        label="Duration"
        valueLabel={formatDurationLabel(filters.maxDuration, durationCeiling)}
        active={filters.maxDuration !== null}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Maximum duration</span>
            <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
              {formatDurationLabel(filters.maxDuration, durationCeiling)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={durationCeiling}
            step={Math.max(1, Math.round(durationCeiling / 50))}
            value={filters.maxDuration ?? durationCeiling}
            onChange={(e) => set("maxDuration", Number(e.target.value))}
            className="w-full accent-violet"
          />
          <button
            type="button"
            onClick={() => set("maxDuration", null)}
            className={`self-start rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
              filters.maxDuration === null ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
            }`}
          >
            Any duration
          </button>
        </div>
      </FilterDropdown>

      {/* Changes / connections */}
      <FilterDropdown
        label="Changes"
        valueLabel={CONNECTION_OPTIONS.find((o) => o.key === filters.connections)?.label ?? "Any"}
        active={filters.connections !== "any"}
      >
        <div className="flex flex-col gap-1">
          {CONNECTION_OPTIONS.map((o) => (
            <OptionRow key={o.key} active={filters.connections === o.key} label={o.label} onClick={() => set("connections", o.key)} />
          ))}
        </div>
      </FilterDropdown>

      {/* Transport — single-select: any / train / bus / flight / mixed */}
      <FilterDropdown
        label="Transport"
        valueLabel={TRANSPORT_OPTIONS.find((o) => o.value === filters.transport)?.label ?? "All modes"}
        active={filters.transport !== "any"}
        panelClassName="w-64"
      >
        <div className="flex flex-col gap-1">
          {TRANSPORT_OPTIONS.map(({ value, label }) => {
            const Icon = TRANSPORT_ICON[value];
            const active = filters.transport === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set("transport", value)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                  active ? "bg-violet-soft text-violet-dark" : "text-ink hover:bg-surface-alt"
                }`}
              >
                <Icon size={15} />
                <span className="font-display text-[13.5px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </FilterDropdown>

      {/* More filters: class, quota, confirmed-only */}
      <FilterDropdown
        label="More filters"
        valueLabel=""
        variant="pill"
        icon={<SlidersHorizontal size={14} />}
        align="right"
        panelClassName="w-80"
        title="More filters"
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => set("confirmedOnly", !filters.confirmedOnly)}
            className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left"
          >
            <span className="font-display text-[13.5px] font-medium text-ink">Fully confirmed only</span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${filters.confirmedOnly ? "bg-violet" : "bg-border"}`}>
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  filters.confirmedOnly ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <div className="flex flex-col gap-3 border-t border-border-soft pt-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Class</span>
                {refining && <span className="font-mono text-[10.5px] text-violet">Refreshing fares…</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRAVEL_CLASS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    disabled={refining}
                    title={o.label}
                    onClick={() => travelClass !== o.value && onRefine({ travelClass: o.value })}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                      travelClass === o.value ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
                    }`}
                  >
                    {o.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Quota</span>
              <div className="flex flex-wrap gap-1.5">
                {QUOTA_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    disabled={refining}
                    onClick={() => quota !== o.value && onRefine({ quota: o.value })}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                      quota === o.value ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FilterDropdown>

      <span className="ml-auto hidden shrink-0 font-mono text-[11px] text-ink-dim sm:inline">
        {resultCount} match{resultCount === 1 ? "" : "es"}
      </span>

      {/* Clear all */}
      <button
        type="button"
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="ml-2 flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 font-display text-[12.5px] font-semibold text-ink-muted transition hover:border-violet hover:text-violet sm:ml-0"
      >
        <RotateCcw size={13} />
        Clear all
      </button>
    </div>
  );
}