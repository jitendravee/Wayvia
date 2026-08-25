"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bus,
  BusFront,
  Plane,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

type Mode = "train" | "bus" | "flight";

const MODE_ICON: Record<Mode, LucideIcon> = {
  train: TrainFront,
  bus: BusFront,
  flight: Plane,
};

const MODE_LABEL: Record<Mode, string> = {
  train: "Train",
  bus: "Bus",
  flight: "Flight",
};

interface RouteOption {
  id: string;
  legs: Mode[];
  /** The D row — Wayvia's picked combination, visually called out. */
  best?: boolean;
}

const ROUTE_OPTIONS: RouteOption[] = [
  { id: "A", legs: ["train", "train"] },
  { id: "B", legs: ["train", "bus"] },
  { id: "C", legs: ["flight", "train"] },
  { id: "D", legs: ["train", "bus", "train"], best: true },
];

const ORIGIN = { name: "New Delhi", code: "NDLS" };
const DESTINATION = { name: "Mumbai Central", code: "MMCT" };

const BEST_MATCH = {
  legs: ["train", "bus", "train"] as Mode[],
  label: "Train → Bus → Train",
  duration: "23h 45m",
  fare: "₹1,840",
  changes: 2,
};

/* ------------------------------------------------------------------ */
/* Layout math for the desktop SVG connectors — kept in one place so    */
/* the curves always land exactly on each row, however row height       */
/* changes (edit ROW_H / ROW_GAP, everything below recalculates).       */
/* ------------------------------------------------------------------ */

const ROW_H = 72;
const ROW_GAP = 16;
const ROW_COUNT = ROUTE_OPTIONS.length;
const GRAPH_H = ROW_COUNT * ROW_H + (ROW_COUNT - 1) * ROW_GAP;

function rowCenterY(i: number) {
  return i * (ROW_H + ROW_GAP) + ROW_H / 2;
}

function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
) {
  const mt = 1 - t;
  return {
    x:
      mt ** 3 * p0.x +
      3 * mt ** 2 * t * p1.x +
      3 * mt * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      mt ** 3 * p0.y +
      3 * mt ** 2 * t * p1.y +
      3 * mt * t ** 2 * p2.y +
      t ** 3 * p3.y,
  };
}

/** Curve from the origin dot (left edge of the graph) into row `i`'s badge. */
function connectorFor(i: number) {
  const p0 = { x: -18, y: GRAPH_H / 2 };
  const p3 = { x: 6, y: rowCenterY(i) };
  const p1 = { x: -4, y: p0.y };
  const p2 = { x: -4, y: p3.y };
  return {
    p0,
    p1,
    p2,
    p3,
    d: `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
  };
}

// Precompute the traveling-dot path for the "best" (last) row.
const BEST_CONNECTOR = connectorFor(ROW_COUNT - 1);
const DOT_STEPS = 36;
const DOT_PATH = Array.from({ length: DOT_STEPS + 1 }, (_, i) =>
  bezierPoint(
    BEST_CONNECTOR.p0,
    BEST_CONNECTOR.p1,
    BEST_CONNECTOR.p2,
    BEST_CONNECTOR.p3,
    i / DOT_STEPS,
  ),
);

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                  */
/* ------------------------------------------------------------------ */

/** A dashed line whose dashes continuously flow in one direction. */
function DashLine({
  vertical = false,
  active = false,
}: {
  vertical?: boolean;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 ${active ? "text-violet" : "text-ink/20"} ${
        vertical ? "h-full w-[2px]" : "h-[2px] w-6"
      }`}
      style={{
        backgroundImage: vertical
          ? "repeating-linear-gradient(to bottom, currentColor 0 4px, transparent 4px 9px)"
          : "repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 9px)",
        backgroundSize: vertical ? "2px 13px" : "13px 2px",
        animation: `${vertical ? "wayviaDashV" : "wayviaDashH"} 0.9s linear infinite`,
      }}
    />
  );
}

function LegPill({ mode }: { mode: Mode }) {
  const Icon = MODE_ICON[mode];
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1.5">
      <Icon size={14} className="text-violet" />
      <span className="font-sans text-[12px] font-medium text-ink">
        {MODE_LABEL[mode]}
      </span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[13px] font-semibold text-ink">
        {value}
      </span>
            <span className=" text-[10.5px] text-ink-dim">{label}</span>

    </div>
  );
}

function BestMatchCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
      className={`relative rounded-2xl border border-violet/25 bg-white p-4 shadow-lg shadow-violet-soft/40 ${className}`}
    >
      <motion.span
        animate={{ scale: [0.9, 1, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center rounded-full bg-violet px-2.5 py-1  text-[10px] font-bold uppercase tracking-wide text-white font-display"
      >
        Best match
      </motion.span>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {BEST_MATCH.legs.map((mode, i) => {
          const Icon = MODE_ICON[mode];

          return (
            <Fragment key={i}>
              {i > 0 && (
                <ArrowRight size={13} className="shrink-0 text-ink-dim" />
              )}

              <span className="flex items-center gap-2 ">
                <span className="flex  shrink-0 items-center justify-center rounded-full  text-ink">
                  <Icon size={14} />
                </span>

                <span className="font-display text-[12px] font-semibold text-ink">
                  {MODE_LABEL[mode]}
                </span>
              </span>
            </Fragment>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Stat label="Duration" value={BEST_MATCH.duration} />
        <Stat label="Total Fare" value={BEST_MATCH.fare} />
        <Stat label="Changes" value={String(BEST_MATCH.changes)} />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop / tablet layout (lg+)                                        */
/* ------------------------------------------------------------------ */

function DesktopRow({ option, index }: { option: RouteOption; index: number }) {
  const isBest = option.best;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      style={{ height: ROW_H }}
      className={`flex items-center gap-3 rounded-2xl border px-4 ${
        isBest ? "border-violet/30 bg-violet-soft/40" : "border-border bg-white"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold ${
          isBest ? "bg-violet text-white" : "bg-violet-soft text-violet-dark"
        }`}
      >
        {option.id}
      </span>

      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {option.legs.map((mode, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2">
            {i > 0 && <DashLine active={isBest} />}
            <LegPill mode={mode} />
          </div>
        ))}
      </div>

      <ArrowRight size={14} className="shrink-0 text-ink-dim" />

      <div
        className={`flex shrink-0 flex-col leading-tight ${
          isBest ? "" : "rounded-xl border border-border bg-white px-3 py-1.5"
        }`}
      >
        <span className="font-sans text-[12px] font-semibold text-ink">
          {DESTINATION.name}
        </span>
        <span className="font-mono text-[10px] text-ink-dim">
          {DESTINATION.code}
        </span>
      </div>
    </motion.div>
  );
}

function DesktopGraph() {
  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_28px_285px] lg:items-center lg:gap-2">
      {/* Origin + curved connectors + rows */}
      <div className="flex items-center gap-10">
        <div className="shrink-0 rounded-2xl border border-border bg-white px-4 py-3">
          <div className="font-display text-[13px] font-bold leading-tight text-ink">
            {ORIGIN.name}
          </div>
          <div className="font-mono text-[10px] text-ink-dim">
            {ORIGIN.code}
          </div>
        </div>

        <div className="relative flex-1" style={{ height: GRAPH_H }}>
          <svg
            viewBox={`-20 0 44 ${GRAPH_H}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute left-[-44px] top-0 h-full overflow-visible"
            style={{ width: "calc(100% + 44px)" }}
          >
            <circle cx={-18} cy={GRAPH_H / 2} r={4.5} className="fill-violet" />
            {ROUTE_OPTIONS.map((opt, i) => {
              const { d } = connectorFor(i);
              return (
                <path
                  key={opt.id}
                  d={d}
                  fill="none"
                  strokeWidth={opt.best ? 2 : 1.5}
                  className={
                    opt.best
                      ? "stroke-violet wayvia-path-fast"
                      : "stroke-ink/20 wayvia-path"
                  }
                  strokeDasharray="5 6"
                  strokeLinecap="round"
                />
              );
            })}
            {/* Glowing dot traveling along the highlighted (best) route */}
            <motion.circle
              r={3.5}
              className="fill-violet"
              style={{ filter: "drop-shadow(0 0 3px rgba(124,92,255,0.85))" }}
              animate={{
                cx: DOT_PATH.map((p) => p.x),
                cy: DOT_PATH.map((p) => p.y),
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            />
          </svg>

          <div className="relative flex flex-col gap-4">
            {ROUTE_OPTIONS.map((opt, i) => (
              <DesktopRow key={opt.id} option={opt} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Connector hint between the graph and the Best Match card */}
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex justify-center text-violet"
      >
        <ArrowRight size={16} />
      </motion.div>

      <BestMatchCard />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile layout (below lg)                                             */
/* ------------------------------------------------------------------ */

function MobileRow({ option, index }: { option: RouteOption; index: number }) {
  const isBest = option.best;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className={`relative z-10 flex items-center gap-2.5 rounded-xl ${
        isBest ? "bg-violet-soft/40 px-2.5 py-2" : "py-1.5"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
          isBest
            ? "bg-violet text-white"
            : "border border-violet/40 bg-white text-violet-dark"
        }`}
      >
        {option.id}
      </span>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {option.legs.map((mode, i) => {
          const Icon = MODE_ICON[mode];
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRight size={11} className="text-ink-dim" />}
              <span className="flex items-center gap-1 font-sans text-[12.5px] font-medium text-ink">
                <Icon size={13} className="text-violet" />
                {MODE_LABEL[mode]}
              </span>
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

function MobileGraph() {
  return (
    <div className="flex flex-col gap-8 lg:hidden">
      <div className="flex items-stretch gap-4">
        <div className="flex shrink-0 flex-col justify-center rounded-2xl border border-border bg-white px-3.5 py-3">
          <span className="font-display text-[13px] font-bold leading-tight text-ink">
            {ORIGIN.name}
          </span>
          <span className="font-mono text-[10px] text-ink-dim">
            {ORIGIN.code}
          </span>
        </div>

        <div className="relative flex-1">
          <div className="absolute bottom-3 left-[9px] top-3">
            <DashLine vertical />
          </div>
          <motion.span
            aria-hidden
            className="absolute left-[5px] h-2 w-2 rounded-full bg-violet"
            style={{ boxShadow: "0 0 6px rgba(124,92,255,0.85)" }}
            animate={{ top: ["4%", "96%", "4%"] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col gap-3.5 pl-0">
            {ROUTE_OPTIONS.map((opt, i) => (
              <MobileRow key={opt.id} option={opt} index={i} />
            ))}
          </div>
        </div>
      </div>

      <BestMatchCard className="w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export default function HowWayviaThinks() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto  flex flex-col text-center items-center gap-3">
          <span className="text-[9px] md:text-[11px] max-w-fit font-semibold uppercase tracking-wider text-violet bg-violet/10 p-2 px-3 rounded-full">
            How Wayvia thinks
          </span>
          <h2 className=" font-display text-2xl font-semibold text-ink sm:text-3xl">
            One destination. Thousands of ways.
          </h2>
          <p className=" font-sans text-[13.5px] leading-relaxed text-ink-muted sm:text-[14px]">
            Wayvia explores every possible combination across modes and
            connections not just the obvious one.
          </p>
        </div>

        <div className="mt-14 sm:mt-16">
          <DesktopGraph />
          <MobileGraph />
        </div>
      </div>

      <style jsx global>{`
        @keyframes wayviaDashH {
          to {
            background-position: -13px 0;
          }
        }
        @keyframes wayviaDashV {
          to {
            background-position: 0 -13px;
          }
        }
        .wayvia-path {
          animation: wayviaPathFlow 1.3s linear infinite;
        }
        .wayvia-path-fast {
          animation: wayviaPathFlow 0.9s linear infinite;
        }
        @keyframes wayviaPathFlow {
          to {
            stroke-dashoffset: -22;
          }
        }
      `}</style>
    </section>
  );
}
