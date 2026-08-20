"use client";

import { useRef } from "react";
import StationInput from "./StationInput";
import {
  CalendarIcon,
  ChevronDownIcon,
  JunctionIcon,
  SeatIcon,
  SlidersIcon,
  SwapIcon,
  TicketIcon,
} from "./Icons";

export interface SearchFormValues {
  from: string;
  to: string;
  date: string;
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
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const fieldClass =
  "flex h-[44px] w-full items-center rounded-xl border border-border bg-white px-3.5 font-mono text-sm text-ink outline-none transition-all focus:border-violet focus:ring-4 focus:ring-violet-ring";

function formatDatePretty(iso: string): string {
  if (!iso) return "Select date";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
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

function SelectField({
  id,
  icon,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        <span className="text-violet">{icon}</span>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} cursor-pointer appearance-none pr-8`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
      </div>
    </div>
  );
}

export default function SearchForm({ values, onChange, onSubmit, loading }: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof SearchFormValues>(key: K, val: SearchFormValues[K]) =>
    onChange({ ...values, [key]: val });

  function swap() {
    onChange({ ...values, from: values.to, to: values.from });
  }

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through to focus/click */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-violet-soft/40"
    >
      <div className="border-b border-border-soft bg-gradient-to-r from-violet-soft/50 via-white to-white px-5 py-4">
        {/* From / swap / To */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <StationInput id="from" label="From" value={values.from} onChange={(code) => set("from", code)} placeholder="Delhi or NDLS" />
          </div>

          <button
            type="button"
            onClick={swap}
            title="Swap origin/destination"
            aria-label="Swap origin and destination"
            className="mb-[1px] flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-white text-ink-muted transition-all hover:rotate-180 hover:border-violet-ring hover:text-violet"
          >
            <SwapIcon className="h-4.5 w-4.5" />
          </button>

          <div className="flex-1">
            <StationInput id="to" label="To" value={values.to} onChange={(code) => set("to", code)} placeholder="Mumbai or BCT" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 px-5 py-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            <span className="text-violet">
              <CalendarIcon className="h-3.5 w-3.5" />
            </span>
            Date
          </label>
          <button type="button" onClick={openDatePicker} className={`${fieldClass} justify-between text-left`}>
            <span>{formatDatePretty(values.date)}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-ink-dim" />
          </button>
          <input
            ref={dateInputRef}
            id="date"
            type="date"
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
            tabIndex={-1}
            className="sr-only"
          />
        </div>

        <SelectField
          id="cls"
          icon={<SeatIcon className="h-3.5 w-3.5" />}
          label="Class"
          value={values.travelClass}
          onChange={(v) => set("travelClass", v)}
          options={["1A", "2A", "3A", "SL", "3E", "CC", "2S"].map((c) => ({ value: c, label: c }))}
        />

        <SelectField
          id="quota"
          icon={<TicketIcon className="h-3.5 w-3.5" />}
          label="Quota"
          value={values.quota}
          onChange={(v) => set("quota", v)}
          options={[
            { value: "GN", label: "General" },
            { value: "TQ", label: "Tatkal" },
            { value: "LD", label: "Ladies" },
          ]}
        />

        <div className="flex flex-col justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-violet-dark font-display text-sm font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Searching…
              </>
            ) : (
              "Find my journey"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 border-t border-border-soft bg-surface-alt/30 px-5 py-4 sm:grid-cols-2">
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