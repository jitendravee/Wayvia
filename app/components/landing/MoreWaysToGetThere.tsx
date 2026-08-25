"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import {
  ArrowRight,
  BusFront,
  ChevronLeft,
  ChevronRight,
  Plane,
  TrainFront,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

type Mode = "train" | "bus" | "flight";

const MODE_ICON: Record<Mode, LucideIcon> = {
  train: TrainFront,
  bus: BusFront,
  flight: Plane,
};

type Tone =
  | "green"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "indigo"
  | "rose"
  | "amber";

const TAG_TONE: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-soft text-violet-dark",
  blue: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-700",
  teal: "bg-teal-50 text-teal-700",
  indigo: "bg-indigo-50 text-indigo-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

interface RouteCardData {
  id: string;
  tag: { label: string; tone: Tone };
  legs: Mode[];
  modeLabel: string;
  from: { name: string; code: string };
  to: { name: string; code: string };
  duration: string;
  changes: number;
  fare: string;
  best?: boolean;
  imageUrl: string;
}

// Same origin/destination across the set — these are alternative ways
// through it. Swap `from`/`to` per card if a future version mixes journeys.
const ORIGIN = { name: "New Delhi", code: "NDLS" };
const DESTINATION = { name: "Mumbai Central", code: "BCT" };
const ROUTE_CARDS: RouteCardData[] = [
  {
    id: "fastest",
    tag: { label: "Fastest", tone: "green" },
    legs: ["flight", "train"],
    modeLabel: "Flight → Train",
    from: ORIGIN,
    to: DESTINATION,
    duration: "18h 20m",
    changes: 1,
    fare: "₹6,240",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "best-value",
    tag: { label: "Best Value", tone: "violet" },
    legs: ["train", "bus"],
    modeLabel: "Train → Bus",
    from: ORIGIN,
    to: DESTINATION,
    duration: "23h 45m",
    changes: 2,
    fare: "₹1,840",
    best: true,
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "fewest-changes",
    tag: { label: "Fewest Changes", tone: "blue" },
    legs: ["train"],
    modeLabel: "Direct Train",
    from: ORIGIN,
    to: DESTINATION,
    duration: "26h 10m",
    changes: 0,
    fare: "₹2,150",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "most-comfortable",
    tag: { label: "Most Comfortable", tone: "orange" },
    legs: ["flight"],
    modeLabel: "Direct Flight",
    from: ORIGIN,
    to: DESTINATION,
    duration: "4h 10m",
    changes: 0,
    fare: "₹7,850",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "budget-pick",
    tag: { label: "Budget Pick", tone: "teal" },
    legs: ["train", "bus"],
    modeLabel: "Train → Bus",
    from: ORIGIN,
    to: DESTINATION,
    duration: "28h 00m",
    changes: 1,
    fare: "₹1,420",
    imageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "overnight",
    tag: { label: "Overnight", tone: "indigo" },
    legs: ["train"],
    modeLabel: "Overnight Train",
    from: ORIGIN,
    to: DESTINATION,
    duration: "22h 15m",
    changes: 1,
    fare: "₹2,050",
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "scenic",
    tag: { label: "Scenic Route", tone: "rose" },
    legs: ["train", "bus", "train"],
    modeLabel: "Train → Bus → Train",
    from: ORIGIN,
    to: DESTINATION,
    duration: "25h 40m",
    changes: 2,
    fare: "₹1,980",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "premium",
    tag: { label: "Premium", tone: "amber" },
    legs: ["flight", "train"],
    modeLabel: "Flight → Train",
    from: ORIGIN,
    to: DESTINATION,
    duration: "8h 40m",
    changes: 1,
    fare: "₹9,800",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
  },
];
/* ------------------------------------------------------------------ */
/* Responsive "cards per page" — 1 on mobile, 2 on tablet, 4 on desktop, */
/* matching the grid-cols breakpoints below so a swipe page always      */
/* lines up with a full row of cards.                                   */
/* ------------------------------------------------------------------ */

function useCardsPerPage() {
  const [n, setN] = useState(4);

  useEffect(() => {
    const mqSm = window.matchMedia("(min-width: 640px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");

    function update() {
      if (mqLg.matches) setN(4);
      else if (mqSm.matches) setN(2);
      else setN(1);
    }

    update();
    mqSm.addEventListener("change", update);
    mqLg.addEventListener("change", update);
    return () => {
      mqSm.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
    };
  }, []);

  return n;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

/* ------------------------------------------------------------------ */
/* Card                                                                 */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 leading-tight">
      <span className="font-display text-[13.5px] font-semibold text-ink">
        {value}
      </span>
      <span className="font-sans text-[11px] text-ink-dim">{label}</span>
    </div>
  );
}
function RouteCard({ card }: { card: RouteCardData }) {
  function handleViewRoute() {
    window.location.assign(`/journey-planner?from=NDLS&to=BCT&date=2026-09-25`);
  }

  return (
    <div
      className={`group relative flex h-full min-h-[340px] max-md:mx-2 flex-col overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        card.best
          ? "border-violet/30 shadow-lg shadow-violet-soft/40"
          : "border-border"
      }`}
    >
      {/* Background image */}
      <Image
        src={card.imageUrl}
        alt=""
        aria-hidden="true"
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Light image overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/80 to-white" />

      {/* Extra subtle violet tint for selected card */}
      {card.best && <div className="absolute inset-0 bg-violet-50/10" />}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col gap-4">
        {/* Tag */}
        <span
          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
            TAG_TONE[card.tag.tone]
          }`}
        >
          {card.tag.label}
        </span>

        {/* Transport icons */}
        <div className="flex items-center gap-2">
          {card.legs.map((mode, i) => {
            const Icon = MODE_ICON[mode];

            return (
              <Fragment key={i}>
                {i > 0 && (
                  <ArrowRight
                    size={14}
                    className={card.best ? "text-violet" : "text-ink-dim"}
                  />
                )}

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm">
                  <Icon size={17} />
                </span>
              </Fragment>
            );
          })}
        </div>

        {/* Route */}
        <div>
          <p className="font-display text-[14.5px] font-semibold text-ink">
            {card.modeLabel}
          </p>

          <p className="mt-1 flex items-center gap-1 font-sans text-[11.5px] text-ink-dim">
            <span className="truncate">{card.from.name}</span>
            <ArrowRight size={10} className="shrink-0" />
            <span className="truncate">{card.to.name}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="mt-auto grid grid-cols-3 gap-2 rounded-xl border border-white/80 bg-white/70 p-3 backdrop-blur-md">
          <Stat label="Duration" value={card.duration} />

          <Stat
            label={card.changes === 1 ? "Change" : "Changes"}
            value={String(card.changes)}
          />

          <Stat label="Fare" value={card.fare} />
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleViewRoute}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-violet/20 bg-white/80 px-4 py-2.5 font-sans text-[12.5px] font-semibold text-violet shadow-sm backdrop-blur-md transition hover:border-violet hover:bg-violet hover:text-white"
        >
          View route
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel                                                             */
/* ------------------------------------------------------------------ */

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 400;

export default function MoreWaysToGetThere() {
  const cardsPerPage = useCardsPerPage();
  const pages = useMemo(() => chunk(ROUTE_CARDS, cardsPerPage), [cardsPerPage]);
  const pageCount = pages.length;
  const [page, setPage] = useState(0);

  // Re-clamp (and reset on breakpoint change, since group sizes change).
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  function goTo(i: number) {
    setPage(Math.max(0, Math.min(i, pageCount - 1)));
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
      goTo(page + 1);
    } else if (
      info.offset.x > SWIPE_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goTo(page - 1);
    }
  }

  return (
    <section className="mx-auto max-w-6xl ">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          More ways to get there.
        </h2>
        <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-ink-muted sm:text-[14px]">
          Compare the routes Wayvia found and choose what works best for you.
        </p>
      </div>

      <div className="relative mt-10 sm:mt-12">
        {pageCount > 1 && (
          <button
            type="button"
            aria-label="Previous routes"
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-2 text-ink shadow-sm transition hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-30 sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="overflow-hidden">
          <motion.div
            className="flex"
            drag={pageCount > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.06}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={{ x: `${-page * 100}%` }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {pages.map((group, pi) => (
              <div
                key={pi}
                className="grid w-full shrink-0 grid-cols-1  sm:grid-cols-2  sm:gap-5 lg:grid-cols-4"
              >
                {group.map((card) => (
                  <RouteCard key={card.id} card={card} />
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {pageCount > 1 && (
          <button
            type="button"
            aria-label="Next routes"
            onClick={() => goTo(page + 1)}
            disabled={page === pageCount - 1}
            className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-2 text-ink shadow-sm transition hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-30 sm:flex"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {pageCount > 1 && (
          <div className="mt-7 flex items-center justify-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to page ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === page ? "w-6 bg-violet" : "w-2 bg-ink/15 hover:bg-ink/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
