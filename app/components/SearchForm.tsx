"use client";

import StationInput from "./StationInput";

export interface SearchFormValues {
  from: string;
  to: string;
  date: string;
  travelClass: string;
  quota: string;
  maxHubs: number;
}

interface Props {
  values: SearchFormValues;
  onChange: (values: SearchFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet-ring";

export default function SearchForm({ values, onChange, onSubmit, loading }: Props) {
  const set = <K extends keyof SearchFormValues>(key: K, val: SearchFormValues[K]) =>
    onChange({ ...values, [key]: val });

  function swap() {
    onChange({ ...values, from: values.to, to: values.from });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm shadow-violet-soft/40"
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end">
        {/* From / swap / To — grouped together so swap always sits between the two, at every breakpoint */}
        <div className="flex flex-1 items-end gap-2">
          <div className="flex-1">
            <StationInput id="from" label="From" value={values.from} onChange={(code) => set("from", code)} placeholder="Delhi or NDLS" />
          </div>

          <button
            type="button"
            onClick={swap}
            title="Swap origin/destination"
            aria-label="Swap origin and destination"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt font-mono text-sm text-ink-muted transition-colors hover:border-violet-ring hover:text-violet"
          >
            ⇄
          </button>

          <div className="flex-1">
            <StationInput id="to" label="To" value={values.to} onChange={(code) => set("to", code)} placeholder="Mumbai or BCT" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3.5 sm:flex sm:shrink-0">
          <div className="flex flex-col gap-1.5 sm:w-36">
            <label htmlFor="date" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:w-24">
            <label htmlFor="cls" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Class
            </label>
            <select id="cls" value={values.travelClass} onChange={(e) => set("travelClass", e.target.value)} className={fieldClass}>
              {["1A", "2A", "3A", "SL", "3E", "CC", "2S"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-28">
            <label htmlFor="quota" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Quota
            </label>
            <select id="quota" value={values.quota} onChange={(e) => set("quota", e.target.value)} className={fieldClass}>
              <option value="GN">General</option>
              <option value="TQ">Tatkal</option>
              <option value="LD">Ladies</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hubs" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Junctions to check
          </label>
          <select
            id="hubs"
            value={values.maxHubs}
            onChange={(e) => set("maxHubs", Number(e.target.value))}
            className={`${fieldClass} w-36`}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={34}>All (34)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-violet px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
        >
          {loading ? "Looking for the best way…" : "Find my journey"}
        </button>
      </div>
    </form>
  );
}