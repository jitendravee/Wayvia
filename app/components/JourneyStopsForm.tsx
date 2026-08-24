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
  /** Visual context — pass the glass-hero classes on the landing page, omit for the default form look. */
  labelClassName?: string;
  inputClassName?: string;
  /** Keeps input ids unique when this form appears more than once on a page. */
  idPrefix: string;
}

function newStop(prefill?: Partial<StopEntry>): StopEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, to: "", date: "", ...prefill };
}

/**
 * Row 0 (origin → stops[0].to, on stops[0].date) is an ordinary single
 * search. The "Add a stop" toggle appends stops[1..] — each one chains from
 * the previous stop's destination, so all this component ever needs is one
 * growable list: A→B on date1 (row 0), B→C on date2 (row 1), C→D on date3
 * (row 2), etc. Turning the toggle off just truncates back to one row.
 */
export default function JourneyStopsForm({ origin, onOriginChange, stops, onStopsChange, labelClassName, inputClassName, idPrefix }: Props) {
  const multi = stops.length > 1;

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
    onStopsChange([...stops, newStop({ date: stops[stops.length - 1]?.date ?? "" })]);
  }

  function removeStop(i: number) {
    if (i === 0) return; // row 0 is the base search, not removable
    onStopsChange(stops.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {stops.map((stop, i) => (
        <StopRow
          key={stop.id}
          idPrefix={`${idPrefix}-${i}`}
          from={i === 0 ? origin : stops[i - 1].to}
          fromEditable={i === 0}
          onFromChange={i === 0 ? onOriginChange : undefined}
          to={stop.to}
          onToChange={(v) => setStop(i, { to: v })}
          date={stop.date}
          onDateChange={(v) => setStop(i, { date: v })}
          onSwap={i === 0 ? swapFirstLeg : undefined}
          onRemove={i > 0 ? () => removeStop(i) : undefined}
          labelClassName={labelClassName}
          inputClassName={inputClassName}
          legNumber={i + 1}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <span
            role="switch"
            aria-checked={multi}
            tabIndex={0}
            onClick={() => toggleMulti(!multi)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleMulti(!multi);
              }
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${multi ? "bg-violet" : "bg-ink/20"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${multi ? "translate-x-4.5" : "translate-x-1"}`} />
          </span>
          <span className={labelClassName ?? "font-mono text-[11px] text-ink-muted"}>Add a stop</span>
        </label>

        {multi && stops.length < MAX_STOPS && (
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-1 rounded-full border border-violet/40 bg-violet-soft/50 px-2.5 py-1 font-mono text-[11px] text-violet-dark transition-colors hover:bg-violet-soft"
          >
            <Plus size={12} /> Add another stop
          </button>
        )}
      </div>
    </div>
  );
}

function StopRow({
  idPrefix,
  from,
  fromEditable,
  onFromChange,
  to,
  onToChange,
  date,
  onDateChange,
  onSwap,
  onRemove,
  labelClassName,
  inputClassName,
  legNumber,
}: {
  idPrefix: string;
  from: string;
  fromEditable: boolean;
  onFromChange?: (code: string) => void;
  to: string;
  onToChange: (code: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  onSwap?: () => void;
  onRemove?: () => void;
  labelClassName?: string;
  inputClassName?: string;
  legNumber: number;
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
    <div className="flex flex-col gap-2">
      {legNumber > 1 && <div className={labelClassName ?? "font-mono text-[10px] uppercase tracking-wider text-ink-dim"}>Stop {legNumber - 1} — then on to</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          {fromEditable ? (
            <StationInput
              id={`${idPrefix}-from`}
              label="From"
              value={from}
              onChange={onFromChange!}
              placeholder="Delhi or NDLS"
              labelClassName={labelClassName}
              inputClassName={inputClassName}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className={labelClassName ?? "font-mono text-[10px] uppercase tracking-wider text-ink-muted"}>From</span>
              <div className="flex h-[44px] items-center rounded-lg border border-dashed border-border bg-surface-alt/50 px-3 font-mono text-sm text-ink-muted">
                {from || "—"} <span className="ml-1.5 text-[10px] text-ink-dim">(previous stop)</span>
              </div>
            </div>
          )}
        </div>

        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            title="Swap origin/destination"
            aria-label="Swap origin and destination"
            className="hidden h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl border border-border bg-white text-ink-muted transition-transform hover:rotate-180 sm:flex"
          >
            <ArrowLeftRight size={16} />
          </button>
        )}

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

        <div className="flex flex-col gap-1.5">
          <span className={labelClassName ?? "font-mono text-[10px] uppercase tracking-wider text-ink-muted"}>Date</span>
          <button type="button" onClick={openDatePicker} className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-left sm:h-auto sm:border-0 sm:bg-transparent sm:px-0">
            <Calendar size={16} className="text-ink/70" />
            <span className="font-semibold text-ink text-[14px]">{formatDatePretty(date)}</span>
          </button>
          <input ref={dateInputRef} type="date" value={date} onChange={(e) => onDateChange(e.target.value)} tabIndex={-1} className="sr-only" />
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove this stop"
            aria-label="Remove this stop"
            className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg text-ink-dim transition-colors hover:bg-signal-red-soft hover:text-signal-red"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}