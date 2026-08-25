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
  /** The row Wayvia picked as the best combination, visually called out. */
  best?: boolean;
}

const ROUTE_OPTIONS: RouteOption[] = [
  { id: "A", legs: ["train", "train","train"] },
  { id: "B", legs: ["train", "bus"] },
  { id: "C", legs: ["flight", "train"] },
  { id: "D", legs: ["train", "bus", "train"], best: true },
];

const BEST_INDEX = ROUTE_OPTIONS.findIndex((o) => o.best);

const ORIGIN = { name: "New Delhi", code: "NDLS" };
const DESTINATION = { name: "Mumbai", code: "MMCT" };

const BEST_MATCH = {
  legs: ["train", "bus", "train"] as Mode[],
  duration: "23h 45m",
  fare: "₹1,840",
  changes: 2,
};

/* ------------------------------------------------------------------ */
/* Branch connector: measures each row's real position and draws a      */
/* curved path from a single origin point to every row — this is the    */
/* "one origin, many routes" visual and it stays correct no matter how  */
/* tall any individual row renders (e.g. the best row wrapping).        */
/* ------------------------------------------------------------------ */

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Point {
  x: number;
  y: number;
}

function bezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
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

function useBranchConnector(rowCount: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [height, setHeight] = useState(0);
  const [centers, setCenters] = useState<number[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const nextCenters = rowRefs.current.map((el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.top - containerTop + r.height / 2;
    });
    setCenters(nextCenters);
    setHeight(container.getBoundingClientRect().height);
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    rowRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, measure]);

  const setRowRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      rowRefs.current[i] = el;
    },
    [],
  );

  return { containerRef, setRowRef, height, centers };
}

function BranchLines({
  height,
  centers,
  bestIndex,
  width,
}: {
  height: number;
  centers: number[];
  bestIndex: number;
  width: number;
}) {
  if (!height || centers.length === 0) return null;

  const originX = 3;
  const originY = height / 2;
  const endX = width - 2;
  const midX = originX + (endX - originX) * 0.55;

  const pathFor = (cy: number) => {
    const p0: Point = { x: originX, y: originY };
    const p1: Point = { x: midX, y: originY };
    const p2: Point = { x: midX, y: cy };
    const p3: Point = { x: endX, y: cy };
    return {
      p0,
      p1,
      p2,
      p3,
      d: `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    };
  };

  const bestPath = bestIndex >= 0 ? pathFor(centers[bestIndex]) : null;
  const steps = 40;
  const dotPath = bestPath
    ? Array.from({ length: steps + 1 }, (_, i) =>
        bezierPoint(bestPath.p0, bestPath.p1, bestPath.p2, bestPath.p3, i / steps),
      )
    : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
    >
      <circle cx={originX} cy={originY} r={4.5} className="fill-violet" />
      {centers.map((cy, i) => {
        const { d } = pathFor(cy);
        const isBest = i === bestIndex;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            strokeWidth={isBest ? 2 : 1.5}
            className={isBest ? "stroke-violet wayvia-path-fast" : "stroke-ink/20 wayvia-path"}
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
        );
      })}
      {bestPath && (
        <motion.circle
          r={3.5}
          className="fill-violet"
          style={{ filter: "drop-shadow(0 0 3px rgba(124,92,255,0.85))" }}
          animate={{
            cx: dotPath.map((p) => p.x),
            cy: dotPath.map((p) => p.y),
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                  */
/* ------------------------------------------------------------------ */

/** A dashed line that fills remaining space, like a connector cable. */
function FillDashLine({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={`block h-[2px] min-w-[24px] flex-1 shrink ${
        active ? "text-violet" : "text-ink/15"
      }`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 9px)",
        backgroundSize: "13px 2px",
        animation: "wayviaDashH 0.9s linear infinite",
      }}
    />
  );
}

function LegPill({ mode, muted = false }: { mode: Mode; muted?: boolean }) {
  const Icon = MODE_ICON[mode];
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1.5">
      <Icon size={14} className={muted ? "text-ink-dim" : "text-ink"} />
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
      <span className="text-[10.5px] text-ink-dim">{label}</span>
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
      {" "}
      <motion.span
        animate={{ scale: [0.9, 1, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center rounded-full bg-violet px-2.5 py-1  text-[10px] font-bold uppercase tracking-wide text-white font-display"
      >
        {" "}
        Best match{" "}
      </motion.span>{" "}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {" "}
        {BEST_MATCH.legs.map((mode, i) => {
          const Icon = MODE_ICON[mode];
          return (
            <Fragment key={i}>
              {" "}
              {i > 0 && (
                <ArrowRight size={13} className="shrink-0 text-ink-dim" />
              )}{" "}
              <span className="flex items-center gap-2 ">
                {" "}
                <span className="flex  shrink-0 items-center justify-center rounded-full  text-ink">
                  {" "}
                  <Icon size={14} />{" "}
                </span>{" "}
                <span className="font-display text-[12px] font-semibold text-ink">
                  {" "}
                  {MODE_LABEL[mode]}{" "}
                </span>{" "}
              </span>{" "}
            </Fragment>
          );
        })}{" "}
      </div>{" "}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {" "}
        <Stat label="Duration" value={BEST_MATCH.duration} />{" "}
        <Stat label="Total Fare" value={BEST_MATCH.fare} />{" "}
        <Stat label="Changes" value={String(BEST_MATCH.changes)} />{" "}
      </div>{" "}
    </motion.div>
  );
}
/* ------------------------------------------------------------------ */
/* Desktop / tablet layout (lg+)                                        */
/* ------------------------------------------------------------------ */

function DesktopRow({
  option,
  index,
  rowRef,
}: {
  option: RouteOption;
  index: number;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const isBest = option.best;
  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${
        isBest ? "border border-violet/25 bg-violet-soft/40" : ""
      }`}
    >
      <span
        className={`w-14 shrink-0 font-sans text-[11px] font-semibold uppercase tracking-wide ${
          isBest ? "text-violet" : "text-ink-dim"
        }`}
      >
        Path {option.id}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {option.legs.map((mode, i) => (
          <Fragment key={i}>
            {i > 0 && <ArrowRight size={13} className="shrink-0 text-ink-dim" />}
            <LegPill mode={mode} />
          </Fragment>
        ))}
      </div>

      <FillDashLine active={isBest} />

      <ArrowRight size={14} className="shrink-0 text-ink-dim" />

      <div className="flex shrink-0 flex-col items-end leading-tight">
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
  const { containerRef, setRowRef, height, centers } = useBranchConnector(
    ROUTE_OPTIONS.length,
  );
  const branchWidth = 56;

  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_28px_300px] lg:items-center lg:gap-2">
      <div className="flex items-center" style={{ gap: branchWidth + 24 }}>
        <div className="shrink-0 rounded-2xl border border-border bg-white px-4 py-3">
          <div className="font-display text-[13px] font-bold leading-tight text-ink">
            {ORIGIN.name}
          </div>
          <div className="font-mono text-[10px] text-ink-dim">{ORIGIN.code}</div>
        </div>

        <div className="relative flex-1">
          <div
            className="absolute top-0"
            style={{ left: -branchWidth, width: branchWidth, height }}
          >
            <BranchLines
              height={height}
              centers={centers}
              bestIndex={BEST_INDEX}
              width={branchWidth}
            />
          </div>

          <div ref={containerRef} className="relative flex flex-col gap-3">
            {ROUTE_OPTIONS.map((opt, i) => (
              <DesktopRow key={opt.id} option={opt} index={i} rowRef={setRowRef(i)} />
            ))}
          </div>
        </div>
      </div>

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

function MobileRow({
  option,
  index,
  rowRef,
}: {
  option: RouteOption;
  index: number;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const isBest = option.best;
  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className={`flex items-center gap-2.5 rounded-xl ${
        isBest ? "border border-violet/25 bg-violet-soft/40 px-3 py-2.5" : "px-1 py-1.5"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
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
              {i > 0 && <ArrowRight size={11} className="shrink-0 text-ink-dim" />}
              <span className="flex items-center gap-1 font-sans text-[12.5px] font-medium text-ink">
                <Icon size={13} className={isBest ? "text-violet" : "text-ink-dim"} />
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
  const { containerRef, setRowRef, height, centers } = useBranchConnector(
    ROUTE_OPTIONS.length,
  );
  const branchWidth = 34;

  return (
    <div className="flex flex-col gap-8 lg:hidden">
      <div className="flex items-center" style={{ gap: branchWidth + 16 }}>
        <div className="flex shrink-0 flex-col justify-center rounded-2xl border border-border bg-white px-3.5 py-3">
          <span className="font-display text-[13px] font-bold leading-tight text-ink">
            {ORIGIN.name}
          </span>
          <span className="font-mono text-[10px] text-ink-dim">{ORIGIN.code}</span>
        </div>

        <div className="relative flex-1">
          <div
            className="absolute top-0"
            style={{ left: -branchWidth, width: branchWidth, height }}
          >
            <BranchLines
              height={height}
              centers={centers}
              bestIndex={BEST_INDEX}
              width={branchWidth}
            />
          </div>

          <div ref={containerRef} className="relative flex flex-col gap-3">
            {ROUTE_OPTIONS.map((opt, i) => (
              <MobileRow key={opt.id} option={opt} index={i} rowRef={setRowRef(i)} />
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
        <div className="mx-auto flex flex-col items-center gap-3 text-center">
          <span className="max-w-fit rounded-full bg-violet/10 p-2 px-3 text-[9px] font-semibold uppercase tracking-wider text-violet md:text-[11px]">
            How Wayvia thinks
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            One destination. Thousands of ways.
          </h2>
          <p className="font-sans text-[13.5px] leading-relaxed text-ink-muted sm:text-[14px]">
            Wayvia explores every possible combination across modes and
            connections — not just the obvious one.
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


