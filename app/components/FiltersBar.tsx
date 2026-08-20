"use client";

import { ConnectionFilter, DepartureWindow, DEPARTURE_WINDOW_LABEL, FilterState, SortKey } from "./filters";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  fareCeiling: number;
  resultCount: number;
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

const chipBase = "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors";
const chipOn = "border-violet bg-violet-soft text-violet-dark";
const chipOff = "border-border bg-white text-ink-muted hover:border-violet-ring hover:text-ink";

export default function FiltersBar({ filters, onChange, fareCeiling, resultCount }: Props) {
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) => onChange({ ...filters, [key]: val });

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Filters</div>
        <div className="font-mono text-[11px] text-ink-dim">{resultCount} match{resultCount === 1 ? "" : "es"}</div>
      </div>

      <div className="space-y-3">
        <FilterRow label="Sort by">
          {SORT_OPTIONS.map((o) => (
            <button key={o.key} type="button" onClick={() => set("sort", o.key)} className={`${chipBase} ${filters.sort === o.key ? chipOn : chipOff}`}>
              {o.label}
            </button>
          ))}
        </FilterRow>

        <FilterRow label="Connections">
          {CONNECTION_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => set("connections", o.key)}
              className={`${chipBase} ${filters.connections === o.key ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </FilterRow>

        <FilterRow label="Departs">
          {DEPARTURE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => set("departure", o.key)}
              className={`${chipBase} ${filters.departure === o.key ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </FilterRow>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-ink-muted">
            <input
              type="checkbox"
              checked={filters.confirmedOnly}
              onChange={(e) => set("confirmedOnly", e.target.checked)}
              className="h-3.5 w-3.5 accent-violet"
            />
            Fully confirmed only
          </label>

          {fareCeiling > 0 && (
            <label className="flex min-w-[180px] flex-1 items-center gap-2 font-mono text-[11px] text-ink-muted">
              Max fare
              <input
                type="range"
                min={0}
                max={fareCeiling}
                step={Math.max(1, Math.round(fareCeiling / 50))}
                value={filters.maxFare ?? fareCeiling}
                onChange={(e) => set("maxFare", Number(e.target.value))}
                className="flex-1 accent-violet"
              />
              <span className="w-16 shrink-0 text-right text-ink">
                {filters.maxFare === null ? `₹${fareCeiling}` : `₹${filters.maxFare}`}
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 font-mono text-[11px] text-ink-dim">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}