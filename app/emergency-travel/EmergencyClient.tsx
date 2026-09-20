"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import RelatedBlogGuides from "../components/RelatedBlogGuides";
import {
  ShieldAlert,
  Flame,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Train,
  Bus,
  Calendar,
  Clock,
  TrendingDown,
  Navigation,
  Compass,
} from "lucide-react";
import {
  FESTIVAL_CORRIDORS,
  RESCUE_BLUEPRINTS,
  EmergencyRescueBlueprint,
  FestivalCorridor,
} from "@/lib/emergency/emergencyRescueEngine";

export default function EmergencyClient() {
  const [selectedCorridorKey, setSelectedCorridorKey] =
    useState("chhath-delhi-patna");

  const currentCorridor = useMemo(() => {
    return (
      FESTIVAL_CORRIDORS.find((c) => c.key === selectedCorridorKey) ||
      FESTIVAL_CORRIDORS[0]
    );
  }, [selectedCorridorKey]);

  const rescuePlans = useMemo(() => {
    return (
      RESCUE_BLUEPRINTS[selectedCorridorKey] ||
      RESCUE_BLUEPRINTS["chhath-delhi-patna"]
    );
  }, [selectedCorridorKey]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-signal-red-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-red">
          <ShieldAlert size={13} />
          Emergency &amp; Sold-Out Rescue Portal
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Get Home When Every Direct Train is Sold Out
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          Diwali, Chhath Puja, Holi, or family emergency showing{" "}
          <code>REGRET / WL 200+</code>? Wayvia synthesizes guaranteed
          multimodal routes, unlocking hidden General Quota seats and high-speed
          highway transfers.
        </p>
      </header>

      {/* FESTIVAL CORRIDOR TABS */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {FESTIVAL_CORRIDORS.map((corridor) => (
          <button
            key={corridor.key}
            onClick={() => setSelectedCorridorKey(corridor.key)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all ${
              selectedCorridorKey === corridor.key
                ? "border-violet bg-violet text-white shadow-sm scale-102"
                : "border-border bg-white text-ink-muted hover:border-violet/40 hover:text-ink"
            }`}
          >
            <span>{corridor.festivalIcon}</span>
            <span>{corridor.festivalName}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                selectedCorridorKey === corridor.key
                  ? "bg-white/20 text-white"
                  : "bg-surface-alt text-ink-dim"
              }`}
            >
              {corridor.fromCode} → {corridor.toCode}
            </span>
          </button>
        ))}
      </div>

      {/* SELECTED CORRIDOR SUMMARY BANNER */}
      <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-white to-surface-alt p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-violet">
              <span>{currentCorridor.festivalIcon}</span>
              <span>{currentCorridor.festivalName.toUpperCase()}</span>
              <span>•</span>
              <span>Peak Rush: {currentCorridor.rushPeakMonths}</span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-ink sm:text-xl">
              {currentCorridor.fromName} ({currentCorridor.fromCode}) →{" "}
              {currentCorridor.toName} ({currentCorridor.toCode})
            </h2>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              {currentCorridor.description}
            </p>
          </div>

          <Link
            href={`/journey-planner?from=${currentCorridor.fromCode}&to=${currentCorridor.toCode}`}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-dark"
          >
            <Compass size={14} />
            <span>Search Live in Journey Planner</span>
          </Link>
        </div>
      </div>

      {/* RESCUE BLUEPRINT CARDS */}
      <div className="mt-8 space-y-6">
        {rescuePlans.map((plan, idx) => {
          return (
            <section
              key={plan.id}
              className="rounded-2xl border-2 border-violet/20 bg-white p-5 shadow-xs transition-all hover:border-violet/40 hover:shadow-sm sm:p-7"
            >
              {/* TOP HEADER: GUARANTEED SCORE & TACTIC */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-xs font-extrabold text-white flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {plan.guaranteedReachScore}% Guaranteed Reach Score
                    </span>
                    <span className="rounded-full bg-violet-soft px-3 py-0.5 font-mono text-xs font-bold text-violet">
                      {plan.rescueTacticLabel}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-lg font-bold text-ink sm:text-xl">
                    {plan.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-ink-muted">
                    {plan.tagline}
                  </p>
                </div>

                {/* SAVINGS BADGE */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-right">
                  <div className="font-mono text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-end gap-1">
                    <TrendingDown size={12} />
                    Estimated Savings
                  </div>
                  <div className="font-mono text-base font-extrabold text-emerald-700">
                    Save ₹{plan.estimatedSavingsRs.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    vs ₹{plan.directFlightPriceSurge} flight surge
                  </div>
                </div>
              </div>

              {/* REALITY VS WAYVIA RESCUE STRIP */}
              <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-surface-alt p-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-dim block">
                    Direct Train Reality:
                  </span>
                  <strong className="text-signal-red font-mono">
                    {plan.directTrainStatus}
                  </strong>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-dim block">
                    Total Journey Duration:
                  </span>
                  <strong className="text-ink font-mono">
                    {plan.totalDurationHours}
                  </strong>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-dim block">
                    Total Ticket Cost:
                  </span>
                  <strong className="text-emerald-700 font-mono text-sm">
                    ₹{plan.totalEstimatedCostRs.toLocaleString("en-IN")} (All
                    Legs)
                  </strong>
                </div>
              </div>

              {/* SEGMENT-BY-SEGMENT RESCUE ITINERARY */}
              <div className="mt-5 space-y-3">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-dim">
                  Rescue Route Segments:
                </div>

                {plan.legs.map((leg, legIdx) => (
                  <div
                    key={legIdx}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet mt-0.5">
                        {leg.mode === "train" ? (
                          <Train size={16} />
                        ) : leg.mode === "bus" ? (
                          <Bus size={16} />
                        ) : (
                          <Navigation size={16} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-ink">
                            Leg {legIdx + 1}: {leg.serviceName}
                          </span>
                          {leg.serviceNo && (
                            <span className="rounded bg-surface-alt px-1.5 py-0.2 font-mono text-[10px] text-ink-muted">
                              #{leg.serviceNo}
                            </span>
                          )}
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 font-mono text-[10px] font-bold text-emerald-700">
                            {leg.seatConfirmationStatus}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 font-mono text-xs text-ink-muted">
                          <span className="text-ink font-semibold">
                            {leg.fromName} ({leg.from})
                          </span>
                          <span>→</span>
                          <span className="text-ink font-semibold">
                            {leg.toName} ({leg.to})
                          </span>
                          <span>•</span>
                          <span>{leg.duration}</span>
                        </div>

                        <p className="mt-1 text-xs text-ink-dim">
                          💡 <strong>Tip:</strong> {leg.bookingTip}
                        </p>
                      </div>
                    </div>

                    {/* DIRECT PRE-FILL BOOKING LINK */}
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={leg.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet/30 bg-violet-soft px-3.5 py-2 text-xs font-bold text-violet transition-colors hover:bg-violet hover:text-white"
                      >
                        <span>Book on {leg.provider}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTIONABLE INSTRUCTIONS */}
              <div className="mt-5 rounded-xl border border-dashed border-border p-4 bg-surface-alt/40">
                <div className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                  How to Execute This Rescue:
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                  {plan.actionableInstructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      {/* FESTIVAL SURVIVAL PLAYBOOK */}
      <section className="mt-14 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          The 3 Rules of Festival Travel Survival in India
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Mastered by experienced travelers to beat the 500% surge and guarantee
          confirmed berths.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              01 • Remote Quota Shifts
            </div>
            <h3 className="mt-1 font-display text-sm font-bold text-ink">
              Book Origin, Board Middle
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Origin stations like Amritsar, Jammu, or Dibrugarh have 4x higher
              General Quotas (GNWL) than intermediate cities. Book from origin
              and select your city as the official IRCTC{" "}
              <strong>Boarding Point</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              02 • High-Speed Hub Split
            </div>
            <h3 className="mt-1 font-display text-sm font-bold text-ink">
              Rail to Hub + Sleeper Bus
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              End-to-end long haul trains sell out first. Intermediate trains
              (like Vande Bharat or Shatabdi to Kanpur, Kota, or Vadodara)
              always have seats. Pair that with an expressway sleeper bus for
              100% reachability.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              03 • TTE Handheld Terminals (HHT)
            </div>
            <h3 className="mt-1 font-display text-sm font-bold text-ink">
              Chart Vacancy Berth Allotment
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              When passenger charts prepare 4 hours prior, un-utilized quotas
              (VIP/Defence/Foreign) get auto-released to the TTE Hand-Held
              Terminal. Check IRCTC Current Booking 3 hours prior for
              last-minute confirmed seats.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED EMERGENCY & RESCUE GUIDES */}
      <RelatedBlogGuides
        title="Sold-Out Travel & Festival Rescue Guides"
        subtitle="Learn how to bypass sold-out waitlists during Chhath, Diwali, Holi, and emergency journeys."
        guides={[
          {
            slug: "emergency-train-ticket-booking-sold-out-rescue-guide",
            title:
              "Emergency Train Travel: How to Reach Home When Every Train Is Sold Out",
            excerpt:
              "The 2026 rescue playbook: Origin GN Quota shifts, expressway bus stitching, and Current Booking counters.",
            category: "Tips",
            readTime: "11 min read",
          },
          {
            slug: "ultimate-split-ticketing-guide-irctc",
            title:
              "The Ultimate Guide to IRCTC Split Ticketing: Find Hidden Seats",
            excerpt:
              "How to legally unlock confirmed berths on sold-out trains by splitting your booking across stations.",
            category: "Tips",
            readTime: "11 min read",
          },
          {
            slug: "diwali-chhath-puja-train-booking-tips",
            title:
              "How to Book Confirmed Train Tickets During Diwali & Chhath Puja Rush",
            excerpt:
              "Opening dates, special train notifications, and alternative route planning for festival travelers.",
            category: "Tips",
            readTime: "8 min read",
          },
        ]}
      />
    </main>
  );
}
