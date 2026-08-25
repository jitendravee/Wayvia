"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BusFront,
  Plus,
  Search,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

type Mode = "train" | "bus";

const MODE_ICON: Record<Mode, LucideIcon> = { train: TrainFront, bus: BusFront };
const MODE_LABEL: Record<Mode, string> = { train: "Train", bus: "Bus" };

interface Stop {
  name: string;
  code: string;
  endpoint?: boolean;
}

interface Leg {
  mode: Mode;
  duration: string;
}

const STOPS: Stop[] = [
  { name: "New Delhi", code: "NDLS", endpoint: true },
  { name: "Jaipur", code: "JP" },
  { name: "Ahmedabad", code: "ADI" },
  { name: "Mumbai Central", code: "MMCT", endpoint: true },
];

const LEGS: Leg[] = [
  { mode: "train", duration: "6h 15m" },
  { mode: "bus", duration: "7h 30m" },
  { mode: "train", duration: "10h 00m" },
];

const BEST_ROUTE = {
  legs: ["train", "bus", "train"] as Mode[],
  duration: "23h 45m",
  changes: 2,
  fare: "\u20B91,840",
};

/* ------------------------------------------------------------------ */
/* Node connector: measures the real screen position of each node and   */
/* draws dashed segments through them — works for a horizontal row      */
/* (the overview graphic) or a vertical list (the mobile timeline)      */
/* without hardcoding any spacing.                                      */
/* ------------------------------------------------------------------ */

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Point {
  x: number;
  y: number;
}

function useNodePositions(count: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Array<HTMLElement | null>>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState<Point[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const nextPoints = nodeRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return { x: r.left - cRect.left + r.width / 2, y: r.top - cRect.top + r.height / 2 };
    });
    setPoints(nextPoints);
    setSize({ w: cRect.width, h: cRect.height });
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    nodeRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, measure]);

  const setNodeRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      nodeRefs.current[i] = el;
    },
    [],
  );

  return { containerRef, setNodeRef, size, points };
}

function NodeConnector({ size, points }: { size: { w: number; h: number }; points: Point[] }) {
  if (!size.w || !size.h || points.length < 2) return null;
  return (
    <svg
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
    >
      {points.slice(1).map((p, i) => {
        const prev = points[i];
        return (
          <path
            key={i}
            d={`M ${prev.x} ${prev.y} L ${p.x} ${p.y}`}
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 6"
            strokeLinecap="round"
            className="stroke-violet/50 wayvia-stop-path"
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Route overview graphic — origin/stop/stop/destination in a row       */
/* ------------------------------------------------------------------ */

function StopLabel({ stop }: { stop: Stop }) {
  return (
    <div className="text-center leading-tight">
      <div className="whitespace-nowrap font-display text-[9.5px] font-bold uppercase tracking-wide text-ink sm:text-[11px]">
        {stop.name}
      </div>
      <div className="font-mono text-[8px] text-ink-dim sm:text-[9.5px]">{stop.code}</div>
    </div>
  );
}

function RouteOverviewNode({
  stop,
  index,
  nodeRef,
}: {
  stop: Stop;
  index: number;
  nodeRef: (el: HTMLElement | null) => void;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2">
      {stop.endpoint && <StopLabel stop={stop} />}

      {stop.endpoint ? (
        <span
          ref={nodeRef as (el: HTMLSpanElement | null) => void}
          className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-violet bg-white"
        />
      ) : (
        <motion.span
          ref={nodeRef}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.25 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet text-white shadow-md shadow-violet-soft/70 sm:h-9 sm:w-9"
        >
          <Plus size={14} strokeWidth={2.5} className="sm:hidden" />
          <Plus size={16} strokeWidth={2.5} className="hidden sm:block" />
        </motion.span>
      )}

      {!stop.endpoint && <StopLabel stop={stop} />}
    </div>
  );
}

function RouteOverview() {
  const { containerRef, setNodeRef, size, points } = useNodePositions(STOPS.length);

  return (
    <div ref={containerRef} className="relative flex items-start justify-between gap-1 px-1">
      <NodeConnector size={size} points={points} />
      {STOPS.map((stop, i) => (
        <RouteOverviewNode key={stop.code} stop={stop} index={i} nodeRef={setNodeRef(i)} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Leg breakdown — single wrapped row on desktop                        */
/* ------------------------------------------------------------------ */

function LegBreakdownDesktop() {
  const items: Array<{ type: "stop"; stop: Stop } | { type: "leg"; leg: Leg }> = [];
  STOPS.forEach((stop, i) => {
    items.push({ type: "stop", stop });
    if (LEGS[i]) items.push({ type: "leg", leg: LEGS[i] });
  });

  return (
    <div className="hidden flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border border-border bg-white px-4 py-3.5 md:flex">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ArrowRight size={13} className="shrink-0 text-ink-dim" />}
          {item.type === "stop" ? (
            <div className="flex flex-col leading-tight">
              <span className="font-sans text-[12.5px] font-semibold text-ink">
                {item.stop.name}
              </span>
              <span className="font-mono text-[10px] text-ink-dim">{item.stop.code}</span>
            </div>
          ) : (
            (() => {
              const Icon = MODE_ICON[item.leg.mode];
              return (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-dim">
                  <Icon size={14} className="text-ink-dim" />
                  {item.leg.duration}
                </span>
              );
            })()
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Leg breakdown — vertical timeline on mobile                          */
/* ------------------------------------------------------------------ */

function LegTimelineMobile() {
  const items: Array<{ type: "stop"; stop: Stop } | { type: "leg"; leg: Leg }> = [];
  STOPS.forEach((stop, i) => {
    items.push({ type: "stop", stop });
    if (LEGS[i]) items.push({ type: "leg", leg: LEGS[i] });
  });

  const { containerRef, setNodeRef, size, points } = useNodePositions(items.length);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 md:hidden">
      <NodeConnector size={size} points={points} />
      {items.map((item, i) =>
        item.type === "stop" ? (
          <div key={i} className="relative z-10 flex items-center gap-3">
            <span
              ref={setNodeRef(i) as (el: HTMLSpanElement | null) => void}
              className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-violet bg-white"
            />
            <div className="leading-tight">
              <div className="font-sans text-[13px] font-semibold text-ink">{item.stop.name}</div>
              <div className="font-mono text-[10px] text-ink-dim">{item.stop.code}</div>
            </div>
          </div>
        ) : (
          <div key={i} className="relative z-10 flex items-center gap-3 pl-[3px]">
            <span
              ref={setNodeRef(i) as (el: HTMLSpanElement | null) => void}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft/50 text-violet"
            >
              {(() => {
                const Icon = MODE_ICON[item.leg.mode];
                return <Icon size={13} />;
              })()}
            </span>
            <span className="font-sans text-[12.5px] font-medium text-ink-dim">
              {MODE_LABEL[item.leg.mode]} \u00B7 {item.leg.duration}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Best route summary card                                              */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-display text-[13.5px] font-semibold text-ink">{value}</span>
      <span className="text-[10.5px] text-ink-dim">{label}</span>
    </div>
  );
}

function BestRouteCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-4 rounded-2xl border border-violet/25 bg-violet-soft/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full bg-violet px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-white">
          Best route
        </span>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-6">
          <div className="flex items-center gap-1.5">
            {BEST_ROUTE.legs.map((mode, i) => {
              const Icon = MODE_ICON[mode];
              return (
                <Fragment key={i}>
                  {i > 0 && <ArrowRight size={13} className="text-ink-dim" />}
                  <span className="flex items-center gap-1 font-display text-[13px] font-semibold text-ink">
                    <Icon size={15} className="text-violet" />
                    {MODE_LABEL[mode]}
                  </span>
                </Fragment>
              );
            })}
          </div>
          <Stat label="Duration" value={BEST_ROUTE.duration} />
          <Stat label="Changes" value={String(BEST_ROUTE.changes)} />
          <Stat label="Total Fare" value={BEST_ROUTE.fare} />
        </div>
      </div>

      <button
        type="button"
        className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-violet px-5 py-3 font-sans text-[13px] font-semibold text-white transition hover:bg-violet-dark sm:w-auto"
      >
        View details
        <ArrowRight size={15} />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Intro panel                                                          */
/* ------------------------------------------------------------------ */

function IntroPanel() {
  return (
    <div className="flex flex-col gap-4">
      <span className="w-fit rounded-full bg-violet/10 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-violet">
        Add a stop
      </span>
      <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-[26px]">
        Add a stop.
        <br />
        Make the journey yours.
      </h2>
      <p className="max-w-xs font-sans text-[13.5px] leading-relaxed text-ink-muted">
        Going somewhere in between? Add a city, station or landmark and
        we&apos;ll find the best way through.
      </p>
      <button
        type="button"
        className="flex w-fit items-center gap-2 rounded-full border border-violet/40 px-4 py-2.5 font-sans text-[13px] font-semibold text-violet transition hover:bg-violet/5"
      >
        <Plus size={15} />
        Add another stop
      </button>
      <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3">
        <Search size={16} className="shrink-0 text-ink-dim" />
        <input
          type="text"
          placeholder="Search city, station or landmark"
          className="w-full bg-transparent font-sans text-[13px] text-ink placeholder:text-ink-dim/70 focus:outline-none"
        />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export default function AddAStopSection() {
  return (
    <section className="p-4 py-10 bg-violet-soft md:mx-10 rounded-lg">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          <div className="lg:w-[300px] lg:shrink-0">
            <IntroPanel />
          </div>

          <div className="flex flex-1 flex-col gap-5">
            <div className="rounded-2xl border border-border bg-white px-5 py-7 sm:px-8">
              <RouteOverview />
            </div>

            <LegBreakdownDesktop />
            <LegTimelineMobile />

            <BestRouteCard />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .wayvia-stop-path {
          animation: wayviaStopPathFlow 1.3s linear infinite;
        }
        @keyframes wayviaStopPathFlow {
          to {
            stroke-dashoffset: -22;
          }
        }
      `}</style>
    </section>
  );
}