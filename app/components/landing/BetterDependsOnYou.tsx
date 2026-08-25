"use client";

import { Fragment, useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Armchair,
  BusFront,
  ChevronDown,
  ChevronsDown,
  ChevronsRight,
  CircleCheck,
  Moon,
  Plane,
  Route,
  Sun,
  Sunrise,
  Sunset,
  TrainFront,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Preview data                                                         */
/* ------------------------------------------------------------------ */
/* This is a canned, illustrative dataset — enough to make every        */
/* control visibly change the "alternative route" preview below so     */
/* people can see how Wayvia would respond, before they run a search.  */

type Mode = "train" | "bus" | "flight";

const MODE_ICON: Record<Mode, LucideIcon> = {
  train: TrainFront,
  bus: BusFront,
  flight: Plane,
};

interface Stop {
  name: string;
  code: string;
}

interface Leg {
  mode: Mode;
  duration: string; // "8h 15m"
}

type GoalKey =
  | "fastest"
  | "cheapest"
  | "fewestChanges"
  | "trainOnly"
  | "avoidFlights"
  | "comfortable";

interface AltRoute {
  stops: Stop[];
  legs: Leg[];
  duration: string; // total, "23h 45m"
  fare: number;
  changes: number;
}

const NDLS: Stop = { name: "New Delhi", code: "NDLS" };
const MMCT: Stop = { name: "Mumbai Central", code: "MMCT" };
const JAIPUR: Stop = { name: "Jaipur", code: "JP" };
const AHMEDABAD: Stop = { name: "Ahmedabad", code: "ADI" };

const ROUTES: Record<GoalKey, AltRoute> = {
  fastest: {
    stops: [NDLS, MMCT],
    legs: [{ mode: "flight", duration: "2h 10m" }],
    duration: "2h 10m",
    fare: 4650,
    changes: 0,
  },
  cheapest: {
    stops: [NDLS, JAIPUR, AHMEDABAD, MMCT],
    legs: [
      { mode: "train", duration: "8h 15m" },
      { mode: "bus", duration: "7h 30m" },
      { mode: "train", duration: "10h 00m" },
    ],
    duration: "23h 45m",
    fare: 1840,
    changes: 2,
  },
  fewestChanges: {
    stops: [NDLS, MMCT],
    legs: [{ mode: "train", duration: "26h 10m" }],
    duration: "26h 10m",
    fare: 2150,
    changes: 0,
  },
  trainOnly: {
    stops: [NDLS, JAIPUR, AHMEDABAD, MMCT],
    legs: [
      { mode: "train", duration: "8h 15m" },
      { mode: "train", duration: "9h 45m" },
      { mode: "train", duration: "10h 00m" },
    ],
    duration: "28h 00m",
    fare: 2340,
    changes: 2,
  },
  avoidFlights: {
    stops: [NDLS, JAIPUR, AHMEDABAD, MMCT],
    legs: [
      { mode: "train", duration: "9h 10m" },
      { mode: "bus", duration: "7h 00m" },
      { mode: "train", duration: "8h 10m" },
    ],
    duration: "24h 20m",
    fare: 1980,
    changes: 2,
  },
  comfortable: {
    stops: [NDLS, MMCT],
    legs: [{ mode: "train", duration: "18h 20m" }],
    duration: "18h 20m",
    fare: 3450,
    changes: 0,
  },
};

const GOALS: { key: GoalKey; label: string; icon: LucideIcon }[] = [
  { key: "fastest", label: "Fastest", icon: Zap },
  { key: "cheapest", label: "Cheapest", icon: Wallet },
  { key: "fewestChanges", label: "Fewest changes", icon: Route },
  { key: "trainOnly", label: "Train only", icon: TrainFront },
  { key: "avoidFlights", label: "Avoid flights", icon: Plane },
  { key: "comfortable", label: "More comfortable", icon: Armchair },
];

const CHANGE_OPTIONS: { label: string; value: number }[] = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3+", value: 99 },
];

type DepartureKey = "morning" | "afternoon" | "evening" | "night";

const DEPARTURE_OPTIONS: {
  key: DepartureKey;
  label: string;
  icon: LucideIcon;
  startMinutes: number; // minutes from midnight
}[] = [
  { key: "morning", label: "Morning", icon: Sunrise, startMinutes: 6 * 60 + 10 },
  { key: "afternoon", label: "Afternoon", icon: Sun, startMinutes: 14 * 60 + 20 },
  { key: "evening", label: "Evening", icon: Sunset, startMinutes: 19 * 60 + 40 },
  { key: "night", label: "Night", icon: Moon, startMinutes: 23 * 60 + 15 },
];

/* ------------------------------------------------------------------ */
/* Time helpers                                                         */
/* ------------------------------------------------------------------ */

function parseDurationMinutes(duration: string): number {
  const h = /(\d+)h/.exec(duration);
  const m = /(\d+)m/.exec(duration);
  return (h ? parseInt(h[1], 10) : 0) * 60 + (m ? parseInt(m[1], 10) : 0);
}

function formatClock(totalMinutes: number): string {
  const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function BetterDependsOnYou() {
  const router = useRouter();

  const [goal, setGoal] = useState<GoalKey>("fastest");
  const [budget, setBudget] = useState(3200);
  const [maxChanges, setMaxChanges] = useState(2);
  const [departure, setDeparture] = useState<DepartureKey>("morning");

  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPulse(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(false), 500);
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, [goal, budget, maxChanges, departure]);

  const route = ROUTES[goal];
  const overBudget = route.fare > budget;
  const overChangeLimit = route.changes > maxChanges;

  const departureMeta = DEPARTURE_OPTIONS.find((d) => d.key === departure)!;
  const departMinutes = departureMeta.startMinutes;
  const durationMinutes = parseDurationMinutes(route.duration);
  const arrivalMinutes = departMinutes + durationMinutes;
  const dayOffset = Math.floor(arrivalMinutes / (24 * 60));

  function handleViewRoute() {
    const first = route.stops[0];
    const last = route.stops[route.stops.length - 1];
    router.push(`/journey-planner?from=${first.code}&to=${last.code}`);
  }

  return (
    <section className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 sm:px-0">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Better depends on you.
        </h2>
        <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-ink-muted sm:text-[14px]">
          Choose what matters most. Wayvia does the rest.
        </p>
      </div>

      {/* Goal chips */}
      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {GOALS.map((g) => {
          const Icon = g.icon;
          const active = goal === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setGoal(g.key)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 font-sans text-[12.5px] font-semibold transition ${
                active
                  ? "border-violet bg-violet text-white shadow-sm shadow-violet-soft"
                  : "border-border bg-white text-ink-dim hover:border-violet/40 hover:text-ink"
              }`}
            >
              <Icon size={14} />
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 grid w-full grid-cols-1 gap-6 rounded-2xl border border-border bg-white p-4 sm:p-6 lg:grid-cols-3 lg:gap-8">
        {/* Budget */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-sans text-[12.5px] font-semibold text-ink">Budget</p>
            <span className="shrink-0 font-mono text-[12px] font-semibold text-violet">
              ₹{budget.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={50}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-4 w-full accent-violet"
            aria-label="Maximum budget"
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-dim">
            <span>₹500</span>
            <span>₹5,000</span>
          </div>
        </div>

        {/* Max changes */}
        <div className="min-w-0">
          <p className="font-sans text-[12.5px] font-semibold text-ink">Maximum changes</p>
          <div className="mt-3 flex gap-2">
            {CHANGE_OPTIONS.map((opt) => {
              const active = maxChanges === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMaxChanges(opt.value)}
                  aria-pressed={active}
                  className={`flex h-9 flex-1 items-center justify-center rounded-lg border font-sans text-[12.5px] font-semibold transition ${
                    active
                      ? "border-violet bg-violet text-white"
                      : "border-border text-ink-dim hover:border-violet/40 hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Departure time */}
        <div className="min-w-0">
          <p className="font-sans text-[12.5px] font-semibold text-ink">Departure time</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEPARTURE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = departure === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDeparture(opt.key)}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 font-sans text-[12px] font-semibold transition ${
                    active
                      ? "border-violet bg-violet text-white"
                      : "border-border text-ink-dim hover:border-violet/40 hover:text-ink"
                  }`}
                >
                  <Icon size={13} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live preview */}
     <div className="mt-8 flex w-full flex-col items-stretch gap-3 lg:flex-row lg:items-stretch lg:gap-4">
        {/* Direct route (static, unavailable) — stretches to match the alternative card's height */}
              <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-5 lg:flex-1">
          <span className="inline-flex  w-fit items-center  rounded-full bg-rose-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-rose-700">
            Direct route
          </span>
 
          <div className="mt-4 flex items-center gap-3">
            <div className="min-w-0 shrink-0">
              <p className="truncate font-display text-[14px] font-semibold text-ink">
                New Delhi
              </p>
              <p className="font-mono text-[11px] text-ink-dim">NDLS</p>
            </div>
 
            {/* dashed connector with the X sitting on top of it */}
            <div className="relative flex h-7 flex-1 items-center">
              <div className="h-0 w-full border-t-2 border-dashed border-rose-300" />
              <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rose-50/60">
                <X size={18} strokeWidth={3} className="text-rose-500" />
              </span>
            </div>
 
            <div className="min-w-0 shrink-0 text-right">
              <p className="truncate font-display text-[14px] font-semibold text-ink">
                Mumbai Central
              </p>
              <p className="font-mono text-[11px] text-ink-dim">MMCT</p>
            </div>
          </div>
 
          <p className="mt-3 text-center font-sans text-[12px] text-rose-600">
            Direct train unavailable
          </p>
        </div>

        {/* Connector */}
        <div className="flex items-center justify-center text-violet/50 lg:hidden">
          <ChevronsDown size={22} />
        </div>
        <div className="hidden items-center justify-center text-violet/40 lg:flex">
          <ChevronsRight size={26} />
        </div>

        {/* Alternative route — reacts to every control above; this card's natural height sets the row height */}
        <div
          className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm transition-shadow duration-300 sm:p-5 lg:flex-[1.4] ${
            pulse ? "border-violet ring-2 ring-violet/25" : "border-violet/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-violet-dark">
              <Route size={11} />
              Wayvia finds another way
            </span>
            <ChevronDown size={14} className="shrink-0 text-ink-dim/50" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={goal}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mt-4"
            >
              {/* Route chain */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-3 font-sans text-[12.5px]">
                {route.stops.map((stop, i) => (
                  <Fragment key={`${stop.code}-${i}`}>
                    {i > 0 && (
                      <span className="flex flex-wrap items-center gap-1.5 text-ink-dim">
                        <ArrowRight size={12} />
                        {(() => {
                          const leg = route.legs[i - 1];
                          const Icon = MODE_ICON[leg.mode];
                          return (
                            <span className="flex items-center gap-1 rounded-full bg-surface-alt px-2 py-1">
                              <Icon size={12} className="text-ink" />
                              <span className="text-[11px] text-ink-dim">{leg.duration}</span>
                            </span>
                          );
                        })()}
                        <ArrowRight size={12} />
                      </span>
                    )}
                    <span className="flex flex-col leading-tight">
                      <span className="font-display font-semibold text-ink">{stop.name}</span>
                      <span className="font-mono text-[10.5px] text-ink-dim">{stop.code}</span>
                    </span>
                  </Fragment>
                ))}
              </div>

              {/* Departs / arrives */}
              <p className="mt-3 font-sans text-[11.5px] text-ink-dim">
                Departs {formatClock(departMinutes)} · Arrives {formatClock(arrivalMinutes)}
                {dayOffset > 0 ? ` +${dayOffset}d` : ""}
              </p>

              {/* Warnings driven by the controls */}
              {(overBudget || overChangeLimit) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {overBudget && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-sans text-[11px] font-medium text-amber-700">
                      ₹{route.fare.toLocaleString("en-IN")} is above your ₹
                      {budget.toLocaleString("en-IN")} budget
                    </span>
                  )}
                  {overChangeLimit && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-sans text-[11px] font-medium text-amber-700">
                      Has {route.changes} changes — more than your limit
                    </span>
                  )}
                </div>
              )}

              {/* Result footer — stacks on mobile, row from sm+ */}
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-sans text-[11.5px] font-semibold text-emerald-700">
                  <CircleCheck size={13} />
                  Alternative found
                </span>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="leading-tight">
                    <p className="font-display text-[13.5px] font-semibold text-ink">
                      {route.duration}
                    </p>
                    <p className="font-sans text-[10.5px] text-ink-dim">Duration</p>
                  </div>
                  <div className="leading-tight">
                    <p className="font-display text-[13.5px] font-semibold text-ink">
                      ₹{route.fare.toLocaleString("en-IN")}
                    </p>
                    <p className="font-sans text-[10.5px] text-ink-dim">Total fare</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleViewRoute}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2 font-sans text-[12px] font-semibold text-violet transition hover:border-violet hover:bg-violet hover:text-white sm:w-auto"
                  >
                    View route
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}