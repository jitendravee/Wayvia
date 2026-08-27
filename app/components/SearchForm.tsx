// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   ArrowLeftRight,
//   ArrowRight,
//   Bus,
//   CalendarDays,
//   LayoutGrid,
//   Plane,
//   Plus,
//   Shuffle,
//   TrainFront,
//   X,
// } from "lucide-react";
// import type { StopEntry } from "./JourneyStopsForm";
// import { JunctionIcon, SlidersIcon } from "./Icons";
// import type { Mode, TripLeg } from "../types";
// import { todayIso } from "@/lib/date";

// export interface SearchFormValues {
//   from: string;
//   to: string;
//   date: string;
//   /**
//    * Not shown in this form on purpose. Class/quota are train-specific
//    * refinements, not part of the base "where + when" search — they're
//    * surfaced on FiltersBar instead, once results exist, so this box stays
//    * mode-agnostic as bus/flight get added. Kept here (with sane defaults)
//    * because the search API still needs *some* class/quota to price fares.
//    */
//   travelClass: string;
//   quota: string;
//   maxHubs: number;
//   /**
//    * How many via-junctions (interchange stations) the search is allowed to go
//    * through — 1, 2, or 3. This is the "time budget" dial: someone in a hurry
//    * keeps it at 1 (direct + a single change); someone flexible on time can
//    * push it to 3 to unlock routes that need two extra changes to complete.
//    */
//   maxConnections: 1 | 2 | 3;
//   /**
//    * Which mode(s) to actually search — this reaches the backend as
//    * /api/search's `modes` param and decides what gets fetched at all
//    * (unlike app/components/ModeSelector.tsx's after-the-fact display
//    * filter, which only hides results already in hand). All three selected
//    * means "search everything" — same as omitting the param entirely.
//    */
//   modes: Mode[];
// }

// export const ALL_SEARCH_MODES: Mode[] = ["train", "bus", "flight"];

// /* ------------------------------------------------------------------ */
// /* Minimal station directory — display only                            */
// /* ------------------------------------------------------------------ */
// /* The rest of the app works purely in station codes (values.from/to    */
// /* are codes like "NDLS"). This list just lets the FROM/TO fields show  */
// /* a human-readable name next to the code, the way the reference design */
// /* does. Unknown codes gracefully fall back to showing the code as the  */
// /* name — nothing breaks, it just won't have a friendly label yet.      */
// const STATIONS: { code: string; name: string }[] = [
//   { code: "NDLS", name: "New Delhi" },
//   { code: "BCT", name: "Mumbai Central" },
//   { code: "CSTM", name: "Mumbai CST" },
//   { code: "HWH", name: "Howrah Jn" },
//   { code: "MAS", name: "Chennai Central" },
//   { code: "SBC", name: "Bengaluru City" },
//   { code: "ADI", name: "Ahmedabad Jn" },
//   { code: "JP", name: "Jaipur" },
//   { code: "PUNE", name: "Pune Jn" },
//   { code: "LKO", name: "Lucknow" },
//   { code: "SC", name: "Secunderabad Jn" },
//   { code: "PNBE", name: "Patna Jn" },
// ];

// function nameForCode(code: string) {
//   const hit = STATIONS.find((s) => s.code === code.toUpperCase());
//   return hit?.name ?? code.toUpperCase();
// }

// function resolveStationInput(raw: string) {
//   const trimmed = raw.trim();
//   if (!trimmed) return "";
//   const match =
//     STATIONS.find((s) => s.code.toLowerCase() === trimmed.toLowerCase()) ??
//     STATIONS.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
//   return match ? match.code : trimmed.toUpperCase();
// }

// function formatDateDisplay(iso: string) {
//   if (!iso) return "Select date";
//   const d = new Date(`${iso}T00:00:00`);
//   if (Number.isNaN(d.getTime())) return iso;
//   const date = d.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
//   const weekday = d.toLocaleDateString("en-IN", { weekday: "short" });
//   return `${date}, ${weekday}`;
// }

// /* ------------------------------------------------------------------ */
// /* FROM / TO field — name shown large, code shown as a small chip       */
// /* ------------------------------------------------------------------ */

// function StationField({
//   id,
//   label,
//   code,
//   onChange,
//   align = "left",
// }: {
//   id: string;
//   label: string;
//   code: string;
//   onChange: (code: string) => void;
//   align?: "left" | "right";
// }) {
//   const [query, setQuery] = useState(() => (code ? nameForCode(code) : ""));

//   // Stay in sync when the code changes from outside typing — the swap
//   // button, "Add a stop" chaining, or a from/to arriving via URL params.
//   useEffect(() => {
//     setQuery(code ? nameForCode(code) : "");
//   }, [code]);

//   return (
//     <div className="min-w-0 flex-1">
//       <label
//         htmlFor={id}
//         className="block font-mono text-[10px] uppercase tracking-wider text-ink-dim"
//       >
//         {label}
//       </label>
//       <div
//         className={`mt-0.5 flex items-baseline gap-1.5 ${align === "right" ? "justify-end" : ""}`}
//       >
//         <input
//           id={id}
//           list={`${id}-list`}
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           onBlur={(e) => onChange(resolveStationInput(e.target.value))}
//           placeholder="City or station"
//           title={query}
//           className={`min-w-0 flex-1 truncate bg-transparent font-display text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-dim ${
//             align === "right" ? "text-right" : ""
//           }`}
//         />
//         {code && (
//           <span className="shrink-0 rounded-md bg-violet-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-violet-dark">
//             {code.toUpperCase()}
//           </span>
//         )}
//       </div>
//       <datalist id={`${id}-list`}>
//         {STATIONS.map((s) => (
//           <option key={s.code} value={s.name}>
//             {s.code}
//           </option>
//         ))}
//       </datalist>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* DATE field — formatted text on top of an invisible native <input>    */
// /* ------------------------------------------------------------------ */

// function DateField({
//   id,
//   value,
//   onChange,
//   className = "",
// }: {
//   id: string;
//   value: string;
//   onChange: (v: string) => void;
//   className?: string;
// }) {
//   const today = todayIso();

//   return (
//     <div className={`min-w-0 flex-1 ${className}`}>
//       <label
//         htmlFor={id}
//         className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-ink-dim"
//       >
//         <CalendarDays size={11} className="text-violet" />
//         Date
//       </label>

//       <input
//         id={id}
//         type="date"
//         value={value}
//         min={today}
//         onChange={(e) => {
//           const date = e.target.value;

//           // Allow only today or future dates
//           if (!date || date >= today) {
//             onChange(date);
//           }
//         }}
//         className="
//           mt-1
//           h-9
//           w-full
//           cursor-pointer
//           rounded-lg
//           border
//           border-border
//           bg-white
//           px-2.5
//           font-display
//           text-[14px]
//           font-semibold
//           text-ink
//           outline-none
//           transition
//           focus:border-violet
//           focus:ring-2
//           focus:ring-violet/20
//         "
//       />
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Mode chips — "All Modes / Trains / Buses / Flights / Mix"            */
// /* ------------------------------------------------------------------ */

// const MODE_PRESETS: {
//   key: string;
//   label: string;
//   icon: React.ComponentType<{ size?: number }>;
//   modes: Mode[];
// }[] = [
//   { key: "all", label: "All Modes", icon: LayoutGrid, modes: ALL_SEARCH_MODES },
//   { key: "train", label: "Trains", icon: TrainFront, modes: ["train"] },
//   { key: "bus", label: "Buses", icon: Bus, modes: ["bus"] },
//   { key: "flight", label: "Flights", icon: Plane, modes: ["flight"] },
//   // Same underlying request as "All Modes" for now (search everything) —
//   // kept as a distinct chip because the reference design calls it out
//   // separately; wire this to a real combined-itinerary flag once the
//   // backend supports mixing modes within a single route.
//   {
//     key: "mix",
//     label: "Mix (Multimodal)",
//     icon: Shuffle,
//     modes: ALL_SEARCH_MODES,
//   },
// ];

// const MAX_HUBS_CEILING = 60;

// const CONNECTIONS_LABEL: Record<1 | 2 | 3, string> = {
//   1: "Fastest search — direct + a single change",
//   2: "The usual balance of speed and coverage",
//   3: "Slowest search, but finds routes the others miss",
// };

// interface Props {
//   values: SearchFormValues;
//   onChange: (values: SearchFormValues) => void;
//   /** "Add a stop" chain beyond the base from→to leg above — B→C, C→D, etc. */
//   extraStops: StopEntry[];
//   onExtraStopsChange: (stops: StopEntry[]) => void;
//   /** Single-leg submit — fired when there are no extra stops. */
//   onSubmit: () => void;
//   /** Multi-city submit — fired instead of onSubmit whenever 1+ extra stops are present. */
//   onSubmitMulti: (legs: TripLeg[]) => void;
//   loading: boolean;
// }

// /** Shared slider look — a filled track drawn under a transparent native range input, so both sliders line up pixel-for-pixel. */
// function RangeField({
//   id,
//   icon,
//   label,
//   value,
//   min,
//   max,
//   step = 1,
//   onChange,
//   valueLabel,
//   hint,
// }: {
//   id: string;
//   icon: React.ReactNode;
//   label: string;
//   value: number;
//   min: number;
//   max: number;
//   step?: number;
//   onChange: (v: number) => void;
//   valueLabel: string;
//   hint: string;
// }) {
//   const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

//   return (
//     <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-alt/60 p-3.5">
//       <div className="flex items-center justify-between">
//         <label
//           htmlFor={id}
//           className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted"
//         >
//           <span className="text-violet">{icon}</span>
//           {label}
//         </label>
//         <span className="rounded-full bg-violet px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
//           {valueLabel}
//         </span>
//       </div>

//       <div className="relative flex h-5 items-center">
//         <div className="pointer-events-none absolute inset-x-0 h-[6px] rounded-full bg-border" />
//         <div
//           className="pointer-events-none absolute left-0 h-[6px] rounded-full bg-gradient-to-r from-violet to-violet-dark transition-[width]"
//           style={{ width: `${pct}%` }}
//         />
//         <input
//           id={id}
//           type="range"
//           min={min}
//           max={max}
//           step={step}
//           value={value}
//           onChange={(e) => onChange(Number(e.target.value))}
//           className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent
//             [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:bg-transparent
//             [&::-moz-range-track]:h-[6px] [&::-moz-range-track]:bg-transparent
//             [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
//             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
//             [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
//             [&::-webkit-slider-thumb]:bg-violet [&::-webkit-slider-thumb]:shadow-md
//             [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
//             [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
//             [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white
//             [&::-moz-range-thumb]:bg-violet [&::-moz-range-thumb]:shadow-md"
//         />
//       </div>

//       <p className="font-mono text-[10.5px] leading-relaxed text-ink-dim">
//         {hint}
//       </p>
//     </div>
//   );
// }

// export default function SearchForm({
//   values,
//   onChange,
//   extraStops,
//   onExtraStopsChange,
//   onSubmit,
//   onSubmitMulti,
//   loading,
// }: Props) {
//   const set = <K extends keyof SearchFormValues>(
//     key: K,
//     val: SearchFormValues[K],
//   ) => onChange({ ...values, [key]: val });

//   const [modePreset, setModePreset] = useState<string>("all");

//   // Keep the highlighted chip honest if `values.modes` changes from
//   // outside this component (e.g. arriving via URL params). Only the
//   // unambiguous single-mode cases are auto-detected — "all" vs "mix" both
//   // map to the same three-mode array, so we never auto-switch into "mix"
//   // on our own, only via an explicit click.
//   useEffect(() => {
//     if (values.modes.length === 1) {
//       const single = MODE_PRESETS.find(
//         (p) => p.modes.length === 1 && p.modes[0] === values.modes[0],
//       );
//       if (single) {
//         setModePreset(single.key);
//         return;
//       }
//     }
//     if (values.modes.length === ALL_SEARCH_MODES.length) {
//       setModePreset((prev) => (prev === "mix" ? prev : "all"));
//     }
//   }, [values.modes]);

//   function selectModePreset(preset: (typeof MODE_PRESETS)[number]) {
//     setModePreset(preset.key);
//     set("modes", preset.modes);
//   }

//   function swapStations() {
//     onChange({ ...values, from: values.to, to: values.from });
//   }

//   function addStop() {
//     onExtraStopsChange([
//       ...extraStops,
//       { id: `stop-${Date.now()}`, to: "", date: values.date },
//     ]);
//   }

//   function updateStop(index: number, patch: Partial<StopEntry>) {
//     onExtraStopsChange(
//       extraStops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
//     );
//   }

//   function removeStop(index: number) {
//     onExtraStopsChange(extraStops.filter((_, i) => i !== index));
//   }

//   // Full chain (base leg + every extra stop) — used to build the legs sent
//   // to the multi-city search and to validate every leg before submit.
//   const stopsForEditor: StopEntry[] = useMemo(
//     () => [{ id: "base", to: values.to, date: values.date }, ...extraStops],
//     [values.to, values.date, extraStops],
//   );

//   const legs: TripLeg[] = useMemo(() => {
//     const chain = [values.from, ...stopsForEditor.map((s) => s.to)];
//     return stopsForEditor.map((s, i) => ({
//       from: chain[i],
//       to: chain[i + 1],
//       date: s.date,
//     }));
//   }, [values.from, stopsForEditor]);

//   const multi = extraStops.length > 0;
//   const invalid = legs.some(
//     (l) =>
//       !l.from.trim() ||
//       !l.to.trim() ||
//       !l.date.trim() ||
//       l.from.trim().toUpperCase() === l.to.trim().toUpperCase(),
//   );

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (invalid) return;
//     if (multi) onSubmitMulti(legs);
//     else onSubmit();
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-violet-soft/40"
//     >
//       {/* Main bar: FROM · swap · TO · DATE · Find a Way · Add a stop */}
//       <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:gap-3">
//         <div className="flex items-center gap-2 sm:gap-3 lg:flex-[1.4]">
//           <StationField
//             id="from"
//             label="From"
//             code={values.from}
//             onChange={(c) => set("from", c)}
//           />

//           <button
//             type="button"
//             onClick={swapStations}
//             aria-label="Swap origin and destination"
//             className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full border border-border bg-surface-alt text-ink-dim transition hover:border-violet hover:bg-violet-soft hover:text-violet"
//           >
//             <ArrowLeftRight size={16} />
//           </button>

//           <StationField
//             id="to"
//             label="To"
//             code={values.to}
//             onChange={(c) => set("to", c)}
//           />
//         </div>

//         <div className="hidden h-11 w-px shrink-0 bg-border lg:block" />

//         <DateField
//           id="date"
//           value={values.date}
//           onChange={(v) => set("date", v)}
//           className="lg:max-w-[190px]"
//         />
//         <div className="hidden h-11 w-px shrink-0 bg-border lg:block" />

//         <div className="flex items-stretch gap-2 sm:gap-3">
//           <button
//             type="submit"
//             disabled={loading || invalid}
//             className="flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet to-violet-dark px-5 font-display text-sm font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 lg:flex-none"
//           >
//             {loading ? (
//               <>
//                 <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
//                 Searching…
//               </>
//             ) : multi ? (
//               `Find my ${legs.length}-stop trip`
//             ) : (
//               <>
//                 Find a Way
//                 <ArrowRight size={15} />
//               </>
//             )}
//           </button>

//           <button
//             type="button"
//             onClick={addStop}
//             className="flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-border px-3 font-display text-[12.5px] font-semibold text-ink-muted transition hover:border-violet hover:text-violet sm:px-4"
//           >
//             <Plus size={15} />
//             Add a stop
//           </button>
//         </div>
//       </div>

//       {/* Extra stops — only appears once "Add a stop" has been used */}
//       {extraStops.length > 0 && (
//         <div className="space-y-3 border-t border-border-soft bg-surface-alt/30 px-4 py-3.5 sm:px-5">
//           {extraStops.map((stop, idx) => (
//             <div
//               key={stop.id}
//               className="flex flex-wrap items-end gap-2 sm:gap-3"
//             >
//               <span className="mb-1 shrink-0 rounded-full bg-violet-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-violet-dark">
//                 Stop {idx + 2}
//               </span>
//               <StationField
//                 id={`stop-to-${stop.id}`}
//                 label="To"
//                 code={stop.to}
//                 onChange={(c) => updateStop(idx, { to: c })}
//               />
//               <DateField
//                 id={`stop-date-${stop.id}`}
//                 value={stop.date}
//                 onChange={(v) => updateStop(idx, { date: v })}
//                 className="max-w-[160px]"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeStop(idx)}
//                 aria-label={`Remove stop ${idx + 2}`}
//                 className="ml-auto shrink-0 rounded-full p-1.5 text-ink-dim transition hover:bg-rose-50 hover:text-rose-600"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Mode chips */}
//       <div className="border-t border-border-soft px-4 py-3 sm:px-5">
//         <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
//           {MODE_PRESETS.map((preset) => {
//             const Icon = preset.icon;
//             const active = modePreset === preset.key;
//             return (
//               <button
//                 key={preset.key}
//                 type="button"
//                 onClick={() => selectModePreset(preset)}
//                 aria-pressed={active}
//                 className={
//                   active
//                     ? "flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-soft px-3 py-2 font-display text-[12.5px] font-semibold text-violet-dark"
//                     : "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-display text-[12.5px] font-medium text-ink-muted transition hover:bg-surface-alt hover:text-ink"
//                 }
//               >
//                 <Icon size={15} />
//                 {preset.label}
//               </button>
//             );
//           })}
//         </div>
//         {/* <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-ink-dim">
//           {multi
//             ? `${legs.length} legs — each priced and searched on its own date.`
//             : "Class & quota live in the filters below, once results come in — change them any time without retyping your route."}
//         </p> */}
//       </div>

//       {/* Advanced: junctions / connections sliders */}
//       {/* <div className="grid grid-cols-1 gap-3.5 border-t border-border-soft bg-surface-alt/30 px-4 py-4 sm:grid-cols-2 sm:px-5">
//         <RangeField
//           id="hubs"
//           icon={<SlidersIcon className="h-3.5 w-3.5" />}
//           label="Junctions to explore"
//           value={values.maxHubs}
//           min={3}
//           max={MAX_HUBS_CEILING}
//           onChange={(v) => set("maxHubs", v)}
//           valueLabel={values.maxHubs >= MAX_HUBS_CEILING ? `${values.maxHubs} (max)` : String(values.maxHubs)}
//           hint="Pulled live from erail.in's station directory — more here means genuinely more junctions get checked."
//         />

//         <RangeField
//           id="connections"
//           icon={<JunctionIcon className="h-3.5 w-3.5" />}
//           label="Via-junctions allowed"
//           value={values.maxConnections}
//           min={1}
//           max={3}
//           onChange={(v) => set("maxConnections", v as 1 | 2 | 3)}
//           valueLabel={`${values.maxConnections} ${values.maxConnections === 1 ? "junction" : "junctions"}`}
//           hint={`${CONNECTIONS_LABEL[values.maxConnections]}. If a search comes back thin, we'll suggest raising this ourselves.`}
//         />
//       </div> */}
//     </form>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  LayoutGrid,
  Plane,
  Shuffle,
  TrainFront,
} from "lucide-react";
import type { StopEntry } from "./JourneyStopsForm";
import JourneyStopsForm from "./JourneyStopsForm";
import type { Mode, TripLeg } from "../types";
import { todayIso } from "@/lib/date";
import ModeSelector from "./ModeSelector";
import { FilterState } from "./filters";

export interface SearchFormValues {
  from: string;
  to: string;
  date: string;
  travelClass: string;
  quota: string;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  modes: Mode[];
}

export const ALL_SEARCH_MODES: Mode[] = ["train"];

/* ------------------------------------------------------------------ */
/* Mode chips – unchanged                                             */
/* ------------------------------------------------------------------ */

const MODE_PRESETS: {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  modes: Mode[];
}[] = [
  { key: "all", label: "All Modes", icon: LayoutGrid, modes: ALL_SEARCH_MODES },
  { key: "train", label: "Trains", icon: TrainFront, modes: ["train"] },
  { key: "bus", label: "Buses", icon: Bus, modes: ["bus"] },
  { key: "flight", label: "Flights", icon: Plane, modes: ["flight"] },
  {
    key: "mix",
    label: "Mix (Multimodal)",
    icon: Shuffle,
    modes: ALL_SEARCH_MODES,
  },
];

interface Props {
  values: SearchFormValues;
  onChange: (values: SearchFormValues) => void;

  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;

  extraStops: StopEntry[];
  onExtraStopsChange: (stops: StopEntry[]) => void;
  onSubmit: () => void;
  onSubmitMulti: (legs: TripLeg[]) => void;
  loading: boolean;
}
export default function SearchForm({
  values,
  onChange,
  extraStops,
  onExtraStopsChange,
  onSubmit,
  filters,
  onFiltersChange,
  onSubmitMulti,
  loading,
}: Props) {
  // We'll manage the entire route state through JourneyStopsForm.
  // Keep a local copy that mirrors the values we need.
  const [origin, setOrigin] = useState(values.from);
  const [stops, setStops] = useState<StopEntry[]>(() => {
    // Build the full stops array: first stop is the main destination,
    // followed by any extra stops.
    return [
      { id: "base", to: values.to, date: values.date },
      ...extraStops.map((s) => ({ ...s })), // preserve ids
    ];
  });

  // Sync local state when external values change (e.g., URL params).
  useEffect(() => {
    setOrigin(values.from);
    setStops([
      { id: "base", to: values.to, date: values.date },
      ...extraStops.map((s) => ({ ...s })),
    ]);
  }, [values.from, values.to, values.date, extraStops]);

  // Whenever the route changes inside JourneyStopsForm, update the parent.
  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    onChange({
      ...values,
      from: newOrigin,
    });
  };

  const handleStopsChange = (newStops: StopEntry[]) => {
    setStops(newStops);
    // The first stop holds the main destination and date.
    const first = newStops[0];
    const rest = newStops.slice(1);
    onChange({
      ...values,
      to: first.to,
      date: first.date,
    });
    // Notify parent about extra stops separately if needed.
    // We'll let the parent's extraStops update via onExtraStopsChange.
    // But we also need to update the parent's extraStops array.
    // We can call onExtraStopsChange(rest) here, but we must ensure
    // we don't cause a loop. Since the parent passes extraStops as prop,
    // we'll update it with the new rest.
    onExtraStopsChange(rest);
  };

  // Build legs for validation and multi‑submit.
  const legs: TripLeg[] = useMemo(() => {
    const chain = [origin, ...stops.map((s) => s.to)];
    return stops.map((s, i) => ({
      from: chain[i],
      to: chain[i + 1],
      date: s.date,
    }));
  }, [origin, stops]);

  const multi = stops.length > 1;
  const invalid = legs.some(
    (l) =>
      !l.from.trim() ||
      !l.to.trim() ||
      !l.date.trim() ||
      l.from.trim().toUpperCase() === l.to.trim().toUpperCase(),
  );

  // Mode chip state.
  const [modePreset, setModePreset] = useState<string>("all");

  useEffect(() => {
    if (values.modes.length === 1) {
      const single = MODE_PRESETS.find(
        (p) => p.modes.length === 1 && p.modes[0] === values.modes[0],
      );
      if (single) setModePreset(single.key);
    }
    if (values.modes.length === ALL_SEARCH_MODES.length) {
      setModePreset((prev) => (prev === "mix" ? prev : "all"));
    }
  }, [values.modes]);

  function selectModePreset(preset: (typeof MODE_PRESETS)[number]) {
    setModePreset(preset.key);
    onChange({ ...values, modes: preset.modes });
  }

  // Submit handler.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    if (multi) onSubmitMulti(legs);
    else onSubmit();
  }

  // Styling for JourneyStopsForm – matches the landing page.
  const glassLabel =
    "font-sans text-[10.5px] uppercase tracking-wide text-ink/45 sm:text-[11px]";
  const glassInput =
    "w-full bg-transparent p-0 font-display font-semibold text-[15px] text-ink outline-none placeholder:text-ink/35 placeholder:font-normal sm:text-[16px]";
  const glassCaption =
    "font-sans text-[11.5px] leading-none text-ink/45 truncate sm:text-[12px]";

  // The search button to be rendered inside JourneyStopsForm (inline on desktop, full‑width on mobile).
  const searchButton = (
    <button
      type="submit"
      disabled={loading || invalid}
      className="flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet to-violet-dark px-5 font-display text-sm font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 sm:flex-none"
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Searching…
        </>
      ) : multi ? (
        `Find my ${legs.length}-stop trip`
      ) : (
        <>
          Find a Way
          <ArrowRight size={15} />
        </>
      )}
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-violet-soft/40"
    >
      {/* The route input – now using the full JourneyStopsForm */}
      <div className="px-4 py-4 sm:px-5">
        <JourneyStopsForm
          idPrefix="search"
          origin={origin}
          onOriginChange={handleOriginChange}
          stops={stops}
          onStopsChange={handleStopsChange}
          labelClassName={glassLabel}
          inputClassName={glassInput}
          captionClassName={glassCaption}
          searchButton={searchButton}
        />
        {invalid && (
          <p className="mt-2 font-sans text-[11px] text-signal-red">
            {multi
              ? "Check every stop has a station and a date, and no two stations in a row match."
              : "Pick two different stations to search."}
          </p>
        )}
      </div>

      {/* Mode chips – unchanged */}
      {/* <div className="border-t border-border-soft px-4 py-3 sm:px-5">
  <ModeSelector
    value={filters.transport}
    onChange={(transport) =>
      onFiltersChange({
        ...filters,
        transport,
      })
    }
  />

      </div> */}

      {/* Advanced sliders (commented out in your original – kept as is) */}
      {/* ... */}
    </form>
  );
}
