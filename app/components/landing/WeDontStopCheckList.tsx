"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BusFront,
  Check,
  ChevronRight,
  Loader2,
  MapPin,
  Plane,
  Route,
  Shuffle,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

interface CheckItem {
  icon: LucideIcon;
  label: string;
}

const CHECKS: CheckItem[] = [
  { icon: TrainFront, label: "Direct trains" },
  { icon: Route, label: "Connecting trains" },
  { icon: BusFront, label: "Bus connections" },
  { icon: Plane, label: "Flight connections" },
  { icon: MapPin, label: "Nearby stations" },
  { icon: Shuffle, label: "Multimodal combinations" },
];

const STATS = {
  combinationsChecked: 12450,
  waysFound: 8,
};

function formatNumber(n: number) {
  return n.toLocaleString("en-IN");
}

/* ------------------------------------------------------------------ */
/* Sequential reveal: item 0 checks, settles to "done", item 1 starts   */
/* checking, and so on — shared by both the desktop bar and the mobile  */
/* timeline so they progress in lockstep with the same rhythm.          */
/* ------------------------------------------------------------------ */

function useSequentialChecks(
  count: number,
  inView: boolean,
  stepDelay = 550,
  startDelay = 400,
) {
  const [doneCount, setDoneCount] = useState(0);
  const allDone = doneCount >= count;

  useEffect(() => {
    if (!inView || allDone) return;
    const delay = doneCount === 0 ? startDelay : stepDelay;
    const timer = setTimeout(() => setDoneCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [inView, doneCount, allDone, stepDelay, startDelay]);

  return { doneCount, allDone };
}

/* ------------------------------------------------------------------ */
/* Count-up number, starts once the section scrolls into view           */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, active: boolean, duration = 1300) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

function StatBlock({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-display text-[17px] font-bold text-ink sm:text-[18px]">
        {formatNumber(count)}
      </span>
      <span className="whitespace-nowrap text-[10.5px] text-ink-dim">{label}</span>
    </div>
  );
}

/** Small status badge shared by both layouts: pending dot / spinner / checkmark. */
function CheckBadge({
  state,
  size = "md",
}: {
  state: "pending" | "checking" | "done";
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-4 w-4" : "h-4 w-4";
  if (state === "done") {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: "backOut" }}
        className={`flex ${dim} items-center justify-center rounded-full bg-emerald-500 text-white`}
      >
        <Check size={10} strokeWidth={3} />
      </motion.span>
    );
  }
  if (state === "checking") {
    return (
      <span className={`flex ${dim} items-center justify-center rounded-full bg-white text-violet`}>
        <Loader2 size={11} className="animate-spin" />
      </span>
    );
  }
  return <span className={`${dim} rounded-full bg-border`} />;
}

/* ------------------------------------------------------------------ */
/* Desktop: horizontal row + a linear progress bar across the top       */
/* ------------------------------------------------------------------ */

function DesktopChecklist({ inView }: { inView: boolean }) {
  const { doneCount, allDone } = useSequentialChecks(CHECKS.length, inView);
  const progressPct = (doneCount / CHECKS.length) * 100;

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:block">
      {/* Linear progress bar */}
      <div className="relative h-[3px] w-full bg-violet-soft/40">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full bg-violet"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-1 items-stretch">
          {CHECKS.map((item, i) => {
            const state = i < doneCount ? "done" : i === doneCount && !allDone ? "checking" : "pending";
            return (
              <Fragment key={item.label}>
                {i > 0 && (
                  <div className="flex shrink-0 items-center justify-center px-0.5">
                    <ArrowRight
                      size={14}
                      className={`transition-colors duration-300 ${
                        i <= doneCount ? "text-violet" : "text-ink-dim/30"
                      }`}
                    />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: state === "pending" ? 0.45 : 1, y: 0 } : {}}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-6 text-center"
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-violet-soft/50 text-violet">
                    <item.icon size={18} />
                    <span className="absolute -right-1 -top-1 ring-2 ring-white rounded-full">
                      <CheckBadge state={state} />
                    </span>
                  </span>
                  <span className=" text-[11.5px] font-medium leading-tight text-ink-dim">
                    {item.label}
                  </span>
                </motion.div>
              </Fragment>
            );
          })}
        </div>

        <div className="flex flex-col items-start gap-4 border-l border-border px-6 py-6">
          <StatBlock
            label="possible combinations checked"
            value={STATS.combinationsChecked}
            active={allDone}
          />
          <StatBlock label="ways found" value={STATS.waysFound} active={allDone} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile: vertical timeline — a connecting rail runs through each node */
/* ------------------------------------------------------------------ */

const ROW_H = 52; // px — must match the rendered row height (icon 32px + py-2.5 top/bottom)

function MobileChecklist({ inView }: { inView: boolean }) {
  const { doneCount, allDone } = useSequentialChecks(CHECKS.length, inView);
  const segments = Math.max(CHECKS.length - 1, 1);
  const railFill = Math.min(doneCount / segments, 1);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white p-4 shadow-sm md:hidden">
      <div className="relative">
        {/* rail track */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[15px] w-[2px] bg-border"
          style={{ top: ROW_H / 2, bottom: ROW_H / 2 }}
        />
        {/* rail fill */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[15px] w-[2px] origin-top bg-violet"
          style={{ top: ROW_H / 2, bottom: ROW_H / 2 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: railFill }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        <div className="flex flex-col">
          {CHECKS.map((item, i) => {
            const state = i < doneCount ? "done" : i === doneCount && !allDone ? "checking" : "pending";
            return (
              <div
                key={item.label}
                className="relative z-10 flex items-center gap-3 py-2.5"
                style={{ minHeight: ROW_H }}
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet ring-4 ring-white">
                  <item.icon size={15} />
                  <span className="absolute -right-1 -top-1 ring-2 ring-white rounded-full">
                    <CheckBadge state={state} size="sm" />
                  </span>
                </span>

                <span
                  className={` text-[13px] font-medium transition-colors duration-300 ${
                    state === "pending" ? "text-ink-dim/60" : "text-ink"
                  }`}
                >
                  {item.label}
                </span>

                {state === "checking" && (
                  <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wide text-violet">
                    checking…
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-3">
        <StatBlock
          label="combinations checked"
          value={STATS.combinationsChecked}
          active={allDone}
        />
        <div className="h-8 w-px bg-border" />
        <StatBlock label="ways found" value={STATS.waysFound} active={allDone} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export default function WeDontStopAtFirstRoute() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-white ">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            We don&apos;t stop at the first route.
          </h2>
          <p className=" text-[13px] text-ink-muted sm:text-[13.5px]">
            When the direct option doesn&apos;t work, Wayvia keeps looking.
          </p>
        </div>

        <div ref={sectionRef} className="mt-8">
          <DesktopChecklist inView={inView} />
          <MobileChecklist inView={inView} />
        </div>
      </div>
    </section>
  );
}