"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BusFront,
  LayoutGrid,
  Plane,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  TrainFront,
  X,
} from "lucide-react";
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
  /** Currently active search-breadth knobs — same deal as class/quota: these came from the last /api/search call, not client-side filtering. */
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  /**
   * Unlike every other filter here, class/quota/maxHubs/maxConnections
   * change what the backend actually searched — so picking a new one
   * re-queries the backend for this same route+date instead of just
   * re-slicing the results already on screen. This is also, deliberately,
   * the only way to retry a search that came back with zero results:
   * FiltersBar stays visible even then specifically so these controls are
   * reachable.
   */
  onRefine: (next: { travelClass?: string; quota?: string; maxHubs?: number; maxConnections?: 1 | 2 | 3 }) => void;
  /** True while a refine request (class/quota/maxHubs/maxConnections) is in flight. */
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

const CONNECTIONS_ALLOWED: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1 junction" },
  { value: 2, label: "2 junctions" },
  { value: 3, label: "3 junctions" },
];

const MAX_HUBS_MIN = 3;
const MAX_HUBS_MAX = 60;

// filters.transport is a single-select TransportFilter ("any" | Mode |
// "mixed"), not a multi-select list — this icon map is display-only, laid
// over your real TRANSPORT_OPTIONS from filters.ts so the labels/values
// stay whatever that file defines.
const TRANSPORT_ICON: Record<TransportFilter, typeof TrainFront> = {
  any: LayoutGrid,
  train: TrainFront,
  bus: BusFront,
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

/** A labeled chip toggle — used throughout the mobile filter sheet for any
 *  single-select group (departure window, changes, transport, class, quota). */
function Chip({
  active,
  label,
  icon,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[12px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        active ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SheetSection({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

/**
 * "Junctions to explore" (maxHubs) is a backend-search-breadth knob, not a
 * client filter — dragging it live would fire a network request per tick,
 * so this tracks a local draft value for smooth dragging and only calls
 * onRefine once the drag/keypress is released. Resyncs its draft whenever
 * the committed value changes from outside (e.g. switching legs).
 */
function HubsSlider({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commitIfChanged() {
    if (draft !== value) onCommit(draft);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Junctions to explore</span>
        <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">{draft}</span>
      </div>
      <input
        type="range"
        min={MAX_HUBS_MIN}
        max={MAX_HUBS_MAX}
        step={1}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(Number(e.target.value))}
        onMouseUp={commitIfChanged}
        onTouchEnd={commitIfChanged}
        onKeyUp={commitIfChanged}
        className="w-full accent-violet disabled:opacity-60"
      />
      <p className="font-mono text-[10.5px] leading-relaxed text-ink-dim">
        More stations checked as possible interchange points — raise this if a route seems to be missing.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom sheet — generic shell shared by the Sort and Filters   */
/* triggers. Locks background scroll while open and closes on backdrop  */
/* tap, Escape, or its own close button.                                */
/* ------------------------------------------------------------------ */

function MobileSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-200 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-4 py-3.5">
          <span className="font-display text-[15px] font-semibold text-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-surface-alt hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-5">{children}</div>
        </div>
        {footer && <div className="shrink-0 border-t border-border-soft bg-white px-4 py-3">{footer}</div>}
      </div>
    </div>
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
  maxHubs,
  maxConnections,
  onRefine,
  refining,
}: Props) {
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) => onChange({ ...filters, [key]: val });

  // Guard against a 0-0 range when there are no results yet (fareCeiling/
  // durationCeiling come from the current result set, so they're 0 right
  // when FiltersBar is most useful — retrying a zero-result search).
  const fareSliderMax = Math.max(1, fareCeiling);
  const durationSliderMax = Math.max(1, durationCeiling);

  const budgetPresets = useMemo(() => {
    const raw = [1500, 2500, 5000, fareCeiling].filter((p) => p <= fareCeiling && p > 0);
    return Array.from(new Set(raw)).sort((a, b) => a - b);
  }, [fareCeiling]);

  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.maxFare !== null) n++;
    if (filters.departure !== "any") n++;
    if (filters.arrival !== "any") n++;
    if (filters.maxDuration !== null) n++;
    if (filters.connections !== "any") n++;
    if (filters.transport !== "any") n++;
    if (filters.confirmedOnly) n++;
    return n;
  }, [filters]);

  const sortLabel = SORT_OPTIONS.find((s) => s.key === filters.sort)?.label ?? "Best match";

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Desktop / tablet — unchanged from before, just hidden below sm.   */}
      {/* ---------------------------------------------------------------- */}
      <div className="mb-5 hidden items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-white px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {/* Best match / sort */}
        <FilterDropdown
          label="Best match"
          valueLabel={sortLabel}
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
              max={fareSliderMax}
              step={Math.max(1, Math.round(fareSliderMax / 50))}
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
              max={durationSliderMax}
              step={Math.max(1, Math.round(durationSliderMax / 50))}
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

        {/* More filters: class, quota, junctions/hubs, confirmed-only */}
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
                  {refining && <span className="font-mono text-[10.5px] text-violet">Re-searching…</span>}
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

            {/* Search breadth — the two knobs that actually widen or narrow
                what got searched in the first place. Kept in the same
                panel as class/quota since all four trigger the same kind
                of re-search, and this is the one place someone stuck with
                zero results can go to try again. */}
            <div className="flex flex-col gap-3 border-t border-border-soft pt-3">
              <div>
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Via-junctions allowed</span>
                <div className="flex flex-wrap gap-1.5">
                  {CONNECTIONS_ALLOWED.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      disabled={refining}
                      onClick={() => maxConnections !== o.value && onRefine({ maxConnections: o.value })}
                      className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                        maxConnections === o.value ? "border-violet bg-violet text-white" : "border-border text-ink-muted hover:border-violet-ring"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <HubsSlider value={maxHubs} disabled={refining} onCommit={(next) => onRefine({ maxHubs: next })} />
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

      {/* ---------------------------------------------------------------- */}
      {/* Mobile — three fixed controls, no horizontal scrolling: Sort,     */}
      {/* Filters (opens a bottom sheet with everything else), Clear all.   */}
      {/* ---------------------------------------------------------------- */}
      <div className="mb-5 flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3 py-2.5 font-display text-[13px] font-semibold text-ink shadow-sm"
        >
          <Sparkles size={14} className="text-violet" />
          <span className="truncate">{sortLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 font-display text-[13px] font-semibold shadow-sm ${
            activeFilterCount > 0 ? "border-violet bg-violet-soft text-violet-dark" : "border-border bg-white text-ink"
          }`}
        >
          <SlidersHorizontal size={14} className={activeFilterCount > 0 ? "text-violet" : "text-violet"} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet px-1 font-mono text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          aria-label="Clear all filters"
          className="flex shrink-0 items-center justify-center rounded-full border border-border bg-white p-2.5 text-ink-muted shadow-sm transition hover:border-violet hover:text-violet"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Sort sheet */}
      <MobileSheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((o) => (
            <OptionRow
              key={o.key}
              active={filters.sort === o.key}
              label={o.label}
              onClick={() => {
                set("sort", o.key);
                setSortOpen(false);
              }}
            />
          ))}
        </div>
      </MobileSheet>

      {/* Filters sheet — everything except sort, in one scrollable stack */}
      <MobileSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2.5 font-display text-[13px] font-semibold text-ink-muted transition hover:border-violet hover:text-violet"
            >
              <RotateCcw size={13} />
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="flex flex-1 items-center justify-center rounded-full bg-violet px-4 py-2.5 font-display text-[13px] font-semibold text-white transition hover:bg-violet-dark"
            >
              Show {resultCount} match{resultCount === 1 ? "" : "es"}
            </button>
          </div>
        }
      >
        <SheetSection
          label="Maximum fare"
          right={
            <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
              {formatBudgetLabel(filters.maxFare, fareCeiling)}
            </span>
          }
        >
          <input
            type="range"
            min={0}
            max={fareSliderMax}
            step={Math.max(1, Math.round(fareSliderMax / 50))}
            value={filters.maxFare ?? fareCeiling}
            onChange={(e) => set("maxFare", Number(e.target.value))}
            className="w-full accent-violet"
          />
          <div className="flex flex-wrap gap-1.5">
            {budgetPresets.map((p) => {
              const isCeiling = p === fareCeiling;
              const active = isCeiling ? filters.maxFare === null : filters.maxFare === p;
              return (
                <Chip
                  key={p}
                  active={active}
                  label={isCeiling ? "No limit" : `₹${p.toLocaleString("en-IN")}`}
                  onClick={() => set("maxFare", isCeiling ? null : p)}
                />
              );
            })}
          </div>
        </SheetSection>

        <SheetSection label="Departure">
          <div className="flex flex-wrap gap-1.5">
            {DEPARTURE_OPTIONS.map((o) => (
              <Chip key={o.key} active={filters.departure === o.key} label={o.label} onClick={() => set("departure", o.key)} />
            ))}
          </div>
        </SheetSection>

        <SheetSection label="Arrival">
          <div className="flex flex-wrap gap-1.5">
            {ARRIVAL_OPTIONS.map((o) => (
              <Chip key={o.key} active={filters.arrival === o.key} label={o.label} onClick={() => set("arrival", o.key)} />
            ))}
          </div>
        </SheetSection>

        <SheetSection
          label="Maximum duration"
          right={
            <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
              {formatDurationLabel(filters.maxDuration, durationCeiling)}
            </span>
          }
        >
          <input
            type="range"
            min={0}
            max={durationSliderMax}
            step={Math.max(1, Math.round(durationSliderMax / 50))}
            value={filters.maxDuration ?? durationCeiling}
            onChange={(e) => set("maxDuration", Number(e.target.value))}
            className="w-full accent-violet"
          />
          <Chip active={filters.maxDuration === null} label="Any duration" onClick={() => set("maxDuration", null)} />
        </SheetSection>

        <SheetSection label="Changes">
          <div className="flex flex-wrap gap-1.5">
            {CONNECTION_OPTIONS.map((o) => (
              <Chip key={o.key} active={filters.connections === o.key} label={o.label} onClick={() => set("connections", o.key)} />
            ))}
          </div>
        </SheetSection>

        <SheetSection label="Transport">
          <div className="flex flex-wrap gap-1.5">
            {TRANSPORT_OPTIONS.map(({ value, label }) => {
              const Icon = TRANSPORT_ICON[value];
              return (
                <Chip
                  key={value}
                  active={filters.transport === value}
                  label={label}
                  icon={<Icon size={13} />}
                  onClick={() => set("transport", value)}
                />
              );
            })}
          </div>
        </SheetSection>

        <SheetSection label="Confirmation">
          <button
            type="button"
            onClick={() => set("confirmedOnly", !filters.confirmedOnly)}
            className="flex w-full items-center justify-between rounded-xl border border-border-soft px-3 py-2.5 text-left"
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
        </SheetSection>

        <SheetSection label="Class" right={refining && <span className="font-mono text-[10.5px] text-violet">Re-searching…</span>}>
          <div className="flex flex-wrap gap-1.5">
            {TRAVEL_CLASS_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={travelClass === o.value}
                label={o.value}
                disabled={refining}
                onClick={() => travelClass !== o.value && onRefine({ travelClass: o.value })}
              />
            ))}
          </div>
        </SheetSection>

        <SheetSection label="Quota">
          <div className="flex flex-wrap gap-1.5">
            {QUOTA_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={quota === o.value}
                label={o.label}
                disabled={refining}
                onClick={() => quota !== o.value && onRefine({ quota: o.value })}
              />
            ))}
          </div>
        </SheetSection>

        <SheetSection label="Via-junctions allowed">
          <div className="flex flex-wrap gap-1.5">
            {CONNECTIONS_ALLOWED.map((o) => (
              <Chip
                key={o.value}
                active={maxConnections === o.value}
                label={o.label}
                disabled={refining}
                onClick={() => maxConnections !== o.value && onRefine({ maxConnections: o.value })}
              />
            ))}
          </div>
        </SheetSection>

        <SheetSection label="Junctions to explore">
          <HubsSlider value={maxHubs} disabled={refining} onCommit={(next) => onRefine({ maxHubs: next })} />
        </SheetSection>
      </MobileSheet>
    </>
  );
}