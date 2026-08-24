"use client";

import { ArrowLeftRight, Calendar, Plus, X } from "lucide-react";
import { useRef } from "react";
import StationInput from "./StationInput";
import { formatDatePretty } from "@/lib/date";

export interface StopEntry {
  /** Stable id for React keys — not sent anywhere, just survives add/remove/reorder. */
  id: string;
  to: string;
  date: string;
}

export const MAX_STOPS = 6;

interface Props {
  origin: string;
  onOriginChange: (code: string) => void;
  stops: StopEntry[];
  onStopsChange: (stops: StopEntry[]) => void;
  onAddStop?: () => void;
  labelClassName?: string;
  inputClassName?: string;
  idPrefix: string;
}

function newStop(prefill?: Partial<StopEntry>): StopEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    to: "",
    date: "",
    ...prefill,
  };
}

const DEFAULT_LABEL = "font-sans text-[11px] text-ink-muted";
const DEFAULT_INPUT =
  "w-full bg-transparent p-0 font-semibold text-[14px] text-ink outline-none placeholder:text-ink/40 placeholder:font-normal";

/**
 * Row 0 (origin → stops[0].to, on stops[0].date) is an ordinary single
 * search, laid out as one compact pill: From | swap | To | divider | Date.
 * The "Add a stop" toggle appends stops[1..] as lighter, chained rows below
 * — each one chains from the previous stop's destination, so all this
 * component ever needs is one growable list: A→B on date1 (row 0), B→C on
 * date2 (row 1), C→D on date3 (row 2), etc. Turning the toggle off just
 * truncates back to one row.
 */
export default function JourneyStopsForm({
  origin,
  onOriginChange,
  stops,
  onStopsChange,
  labelClassName,
  inputClassName,
  idPrefix,
}: Props) {
  const multi = stops.length > 1;
  const label = labelClassName ?? DEFAULT_LABEL;
  const input = inputClassName ?? DEFAULT_INPUT;

  function setStop(i: number, patch: Partial<StopEntry>) {
    onStopsChange(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function swapFirstLeg() {
    const first = stops[0];
    onOriginChange(first.to);
    setStop(0, { to: origin });
  }

  function toggleMulti(on: boolean) {
    if (on) {
      if (stops.length < 2) {
        onStopsChange([...stops, newStop({ date: stops[0]?.date ?? "" })]);
      }
    } else {
      onStopsChange(stops.slice(0, 1));
    }
  }

  function addStop() {
    if (stops.length >= MAX_STOPS) return;
    onStopsChange([
      ...stops,
      newStop({ date: stops[stops.length - 1]?.date ?? "" }),
    ]);
  }

  function removeStop(i: number) {
    if (i === 0) return; // row 0 is the base search, not removable
    onStopsChange(stops.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Row 0 — the primary From / To / Date pill */}
      <div className="flex flex-col gap-2">
        <PrimaryRow
          idPrefix={`${idPrefix}-0`}
          from={origin}
          onFromChange={onOriginChange}
          to={stops[0]?.to ?? ""}
          onToChange={(v) => setStop(0, { to: v })}
          date={stops[0]?.date ?? ""}
          onDateChange={(v) => setStop(0, { date: v })}
          onSwap={swapFirstLeg}
          labelClassName={label}
          inputClassName={input}
        />

        {/* Rows 1+ — chained stops, visually lighter so the eye reads them as extensions of row 0 */}
        {multi && (
          <div className="flex flex-col gap-1.5 border-l-2 border-violet/20 pl-3 ml-2">
            {stops.slice(1).map((stop, idx) => {
              const i = idx + 1;
              return (
                <StopRow
                  key={stop.id}
                  idPrefix={`${idPrefix}-${i}`}
                  stopNumber={i}
                  from={stops[i - 1].to}
                  to={stop.to}
                  onToChange={(v) => setStop(i, { to: v })}
                  date={stop.date}
                  onDateChange={(v) => setStop(i, { date: v })}
                  onRemove={() => removeStop(i)}
                  labelClassName={label}
                  inputClassName={input}
                />
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          {multi && stops.length < MAX_STOPS && (
            <button
              type="button"
              onClick={addStop}
              className="flex items-center gap-1 rounded-full border border-violet/40 bg-violet-soft/50 px-2.5 py-1 font-sans text-[11px] font-medium text-violet-dark transition-colors hover:bg-violet-soft"
            >
              <Plus size={12} /> Add another stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The single-row search bar: From | swap | To | divider | Date, all inline,
 * matching the compact pill shown on the landing hero. The parent page
 * supplies the surrounding card (bg, radius, shadow) — this component only
 * lays out its own fields, so it stays reusable outside the hero too.
 */
function PrimaryRow({
  idPrefix,
  from,
  onFromChange,
  to,
  onToChange,
  date,
  onDateChange,
  onSwap,
  labelClassName,
  inputClassName,
}: {
  idPrefix: string;
  from: string;
  onFromChange: (code: string) => void;
  to: string;
  onToChange: (code: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  onSwap: () => void;
  labelClassName: string;
  inputClassName: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:divide-x sm:divide-ink/10">
      <div className="flex flex-1 items-center gap-2 sm:pr-3">
        <div className="min-w-0 flex-1">
          <StationInput
            id={`${idPrefix}-from`}
            label="From"
            value={from}
            onChange={onFromChange}
            placeholder="Delhi or NDLS"
            labelClassName={labelClassName}
            inputClassName={inputClassName}
          />
        </div>

        <button
          type="button"
          onClick={onSwap}
          title="Swap origin/destination"
          aria-label="Swap origin and destination"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-alt text-ink-muted transition-transform hover:rotate-180 hover:text-violet"
        >
          <ArrowLeftRight size={14} />
        </button>

        <div className="min-w-0 flex-1">
          <StationInput
            id={`${idPrefix}-to`}
            label="To"
            value={to}
            onChange={onToChange}
            placeholder="Mumbai or BCT"
            labelClassName={labelClassName}
            inputClassName={inputClassName}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:min-w-[150px] sm:pl-3">
        <button
          type="button"
          onClick={openDatePicker}
          className="flex w-full items-center gap-2 rounded-lg py-1 text-left"
        >
          <Calendar size={15} className="shrink-0 text-violet" />
          <span className="flex flex-col gap-0.5">
            <span className={labelClassName}>Date</span>
            <span className="font-semibold text-ink text-[14px] leading-none">
              {formatDatePretty(date)}
            </span>
          </span>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          tabIndex={-1}
          className="sr-only"
        />
      </div>
    </div>
  );
}

/** A chained stop row (B→C, C→D, ...) — a lighter echo of the primary row. */
function StopRow({
  idPrefix,
  stopNumber,
  from,
  to,
  onToChange,
  date,
  onDateChange,
  onRemove,
  labelClassName,
  inputClassName,
}: {
  idPrefix: string;
  stopNumber: number;
  from: string;
  to: string;
  onToChange: (code: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  onRemove: () => void;
  labelClassName: string;
  inputClassName: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-alt/50 px-3 py-2">
      <span className="shrink-0 rounded-full bg-violet-soft px-1.5 py-0.5 font-sans text-[10px] font-semibold text-violet-dark">
        {stopNumber}
      </span>

      <span className="hidden shrink-0 items-center gap-1 font-sans text-[12px] text-ink-muted sm:flex">
        {from || "—"}
        <ArrowLeftRight size={11} className="text-ink-dim" />
      </span>

      <div className="min-w-0 flex-1">
        <StationInput
          id={`${idPrefix}-to`}
          label="To"
          value={to}
          onChange={onToChange}
          placeholder="Next stop"
          labelClassName={labelClassName}
          inputClassName={inputClassName}
        />
      </div>

      <button
        type="button"
        onClick={openDatePicker}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5"
      >
        <Calendar size={13} className="text-violet" />
        <span className="font-semibold text-ink text-[12.5px]">
          {formatDatePretty(date)}
        </span>
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        tabIndex={-1}
        className="sr-only"
      />

      <button
        type="button"
        onClick={onRemove}
        title="Remove this stop"
        aria-label="Remove this stop"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-signal-red-soft hover:text-signal-red"
      >
        <X size={14} />
      </button>
    </div>
  );
}
