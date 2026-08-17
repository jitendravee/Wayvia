"use client";

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
  "w-full rounded-md border border-board-line bg-board-raised px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-flap";

export default function SearchForm({ values, onChange, onSubmit, loading }: Props) {
  const set = <K extends keyof SearchFormValues>(key: K, val: SearchFormValues[K]) =>
    onChange({ ...values, [key]: val });

  function swap() {
    onChange({ ...values, from: values.to, to: values.from });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-lg border border-board-line bg-board-raised/60 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
    >
      <div className="grid grid-cols-2 gap-3.5 items-end sm:grid-cols-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            From
          </label>
          <input
            id="from"
            value={values.from}
            onChange={(e) => set("from", e.target.value.toUpperCase())}
            placeholder="NDLS"
            className={fieldClass}
          />
        </div>

        <button
          type="button"
          onClick={swap}
          title="Swap origin/destination"
          className="row-start-1 hidden h-[42px] w-[42px] items-center justify-center self-end rounded-md border border-board-line bg-board-panel font-mono text-sm text-ink-muted transition-colors hover:border-flap-dim hover:text-flap sm:flex"
        >
          ⇄
        </button>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            To
          </label>
          <input
            id="to"
            value={values.to}
            onChange={(e) => set("to", e.target.value.toUpperCase())}
            placeholder="BCT"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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
          className="rounded-md bg-flap px-6 py-2.5 font-display text-sm font-semibold text-board transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Looking for the best way…" : "Find my journey"}
        </button>
      </div>
    </form>
  );
}
