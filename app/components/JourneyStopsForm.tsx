"use client";

import { ArrowLeftRight, Calendar, MapPin, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import StationInput from "./StationInput";
import { formatDatePretty } from "@/lib/date";

export interface StopEntry {
  /** Stable id for React keys — not sent anywhere, just survives add/remove/reorder. */
  id: string;
  to: string;
  date: string;
}

export const MAX_STOPS = 3;

interface Props {
  origin: string;
  onOriginChange: (code: string) => void;
  stops: StopEntry[];
  onStopsChange: (stops: StopEntry[]) => void;
  /** Visual context — pass the glass-hero classes on the landing page, omit for the default form look. */
  labelClassName?: string;
  inputClassName?: string;
  /** Caption under From/To showing the resolved station name (e.g. "New Delhi"). Omit for the default form look. */
  captionClassName?: string;
  /** Keeps input ids unique when this form appears more than once on a page. */
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
const DEFAULT_CAPTION = "font-sans text-[12px] leading-none text-ink-muted truncate";

function dayName(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/** Looks up a bare station code's full name for read-only display (the chained-stop "from" chip). */
function useResolvedStationName(code: string) {
  const [name, setName] = useState("");

  useEffect(() => {
    const c = code.trim().toUpperCase();
    if (!c) {
      setName("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(c)}&limit=8`);
        const json = await res.json();
        const match = (json.results ?? []).find(
          (r: { code: string; name: string }) => r.code.toUpperCase() === c
        );
        if (!cancelled) setName(match?.name ?? "");
      } catch {
        if (!cancelled) setName("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return name;
}

/**
 * Row 0 (origin → stops[0].to, on stops[0].date) is an ordinary single
 * search, laid out as one compact pill: From | swap | To | divider | Date.
 * A single "Add a stop" / "Add another stop" button at the bottom appends
 * stops[1..] as chained rows — each one chains from the previous stop's
 * destination, so all this component ever needs is one growable list:
 * A→B on date1 (row 0), B→C on date2 (row 1), C→D on date3 (row 2), etc.
 * Removing a stop (X) just shortens the list again.
 */
export default function JourneyStopsForm({
  origin,
  onOriginChange,
  stops,
  onStopsChange,
  labelClassName,
  inputClassName,
  captionClassName,
  idPrefix,
}: Props) {
  const label = labelClassName ?? DEFAULT_LABEL;
  const input = inputClassName ?? DEFAULT_INPUT;
  const caption = captionClassName ?? DEFAULT_CAPTION;

  function setStop(i: number, patch: Partial<StopEntry>) {
    onStopsChange(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function swapFirstLeg() {
    const first = stops[0];
    onOriginChange(first.to);
    setStop(0, { to: origin });
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
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {/* Row 0 — the primary From / To / Date pill */}
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
        captionClassName={caption}
      />

      {/* Rows 1+ — chained stops, one growable list appended by the button below */}
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
            captionClassName={caption}
          />
        );
      })}

      {stops.length < MAX_STOPS && (
        <button
          type="button"
          onClick={addStop}
          className="flex w-fit items-center gap-1.5 rounded-full border border-violet/40 bg-violet-soft/50 px-3 py-1.5 font-sans text-[12px] font-medium text-violet-dark transition-colors hover:bg-violet-soft sm:text-[12.5px]"
        >
          <Plus size={13} /> {stops.length > 1 ? "Add another stop" : "Add a stop"}
        </button>
      )}
    </div>
  );
}

/**
 * The single-row search bar: From | swap | To | divider | Date. Rows to a
 * column on mobile (fields block, then date block, split by a hairline) and
 * to one inline row from `sm` up, matching the compact pill on the hero.
 * The parent page supplies the surrounding card (bg, radius, shadow) — this
 * component only lays out its own fields, so it stays reusable elsewhere.
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
  captionClassName,
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
  captionClassName: string;
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
    <div className="flex flex-col divide-y divide-ink/10 sm:flex-row sm:items-center sm:gap-4 sm:divide-y-0 sm:divide-x">
      <div className="flex flex-1 items-center gap-2 pb-3 sm:gap-4 sm:pr-4 sm:pb-0">
        <div className="flex min-w-0 flex-1 items-start gap-1.5 sm:gap-2">
          <span className="mt-[20px] h-2 w-2 shrink-0 rounded-full bg-violet sm:mt-[22px]" />
          <StationInput
            id={`${idPrefix}-from`}
            label="From"
            value={from}
            onChange={onFromChange}
            placeholder="Delhi or NDLS"
            labelClassName={labelClassName}
            inputClassName={inputClassName}
            showStationName
            subLabelClassName={captionClassName}
          />
        </div>

        <button
          type="button"
          onClick={onSwap}
          title="Swap origin/destination"
          aria-label="Swap origin and destination"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-violet shadow-sm transition-transform hover:rotate-180 sm:h-9 sm:w-9"
        >
          <ArrowLeftRight size={14} className="sm:hidden" />
          <ArrowLeftRight size={15} className="hidden sm:block" />
        </button>

        <div className="flex min-w-0 flex-1 items-start gap-1.5 sm:gap-2">
          <MapPin size={15} className="mt-[18px] shrink-0 text-violet sm:mt-[20px] sm:size-4" />
          <StationInput
            id={`${idPrefix}-to`}
            label="To"
            value={to}
            onChange={onToChange}
            placeholder="Mumbai or BCT"
            labelClassName={labelClassName}
            inputClassName={inputClassName}
            showStationName
            subLabelClassName={captionClassName}
          />
        </div>
      </div>

      <div className="flex items-start gap-1.5 pt-3 sm:min-w-[160px] sm:gap-2 sm:pt-0 sm:pl-4">
        <Calendar size={15} className="mt-[18px] shrink-0 text-violet sm:mt-[20px] sm:size-4" />
        <button type="button" onClick={openDatePicker} className="flex flex-col gap-1 text-left">
          <span className={labelClassName}>Date</span>
          <span className="font-semibold text-ink text-[13.5px] leading-none sm:text-[14px]">
            {formatDatePretty(date)}
          </span>
          {dayName(date) && <span className={captionClassName}>{dayName(date)}</span>}
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

/** A chained stop row (B→C, C→D, ...) — a lighter echo of the primary row. Wraps gracefully on narrow screens instead of squishing. */
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
  captionClassName,
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
  captionClassName: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const fromName = useResolvedStationName(from);

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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-surface-alt/60 px-3 py-2.5 sm:flex-nowrap sm:gap-x-4">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-soft font-sans text-[11px] font-semibold text-violet-dark">
        {stopNumber}
      </span>

      <div className="flex min-w-0 shrink-0 items-start gap-1.5">
        <MapPin size={14} className="mt-[3px] shrink-0 text-ink-dim" />
        <div className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-semibold text-ink text-[13.5px] sm:text-[14px]">{from || "—"}</span>
          {fromName && <span className={`${captionClassName} mt-1`}>{fromName}</span>}
        </div>
      </div>

      <div className="hidden h-8 w-px shrink-0 bg-border sm:block" />

      <div className="flex min-w-[140px] flex-1 items-start gap-1.5 basis-full sm:basis-auto sm:min-w-0">
        <MapPin size={14} className="mt-[20px] shrink-0 text-violet" />
        <StationInput
          id={`${idPrefix}-to`}
          label="To"
          value={to}
          onChange={onToChange}
          placeholder="Next stop"
          labelClassName={labelClassName}
          inputClassName={inputClassName}
          showStationName
          subLabelClassName={captionClassName}
        />
      </div>

      <button
        type="button"
        onClick={openDatePicker}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5"
      >
        <Calendar size={13} className="text-violet" />
        <span className="font-semibold text-ink text-[12px] sm:text-[12.5px]">{formatDatePretty(date)}</span>
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
        className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-signal-red-soft hover:text-signal-red sm:ml-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}