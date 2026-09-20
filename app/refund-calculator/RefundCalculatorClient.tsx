"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RelatedBlogGuides from "../components/RelatedBlogGuides";
import {
  Calculator,
  Receipt,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  HelpCircle,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Train,
  CreditCard,
  Building2,
  Send,
} from "lucide-react";
import {
  TravelClass,
  BookingQuota,
  TicketStatusType,
  CancellationTiming,
  CLASS_METADATA,
  RefundCalculationInput,
  calculateRefund,
  parsePnrDataToRefundInput,
  parseSmsOrTicketText,
  RULES_REFERENCE_TABLE,
} from "@/lib/refund/refundEngine";
import { PnrApiResponse } from "@/lib/erail/pnrTypes";

interface PresetScenario {
  id: string;
  title: string;
  badge: string;
  input: RefundCalculationInput;
}

const PRESETS: PresetScenario[] = [
  {
    id: "3a-cnf-safe",
    title: "Rajdhani 3A Confirmed (>48h)",
    badge: "Lowest Penalty",
    input: {
      ticketClass: "3A",
      ticketFare: 2700,
      passengerCount: 2,
      ticketStatus: "CNF",
      quota: "GN",
      timing: "MORE_THAN_48_HRS",
    },
  },
  {
    id: "tatkal-cnf-warn",
    title: "Tatkal Confirmed (0% Warning)",
    badge: "Zero Refund",
    input: {
      ticketClass: "3A",
      ticketFare: 2150,
      passengerCount: 1,
      ticketStatus: "CNF",
      quota: "TQ",
      timing: "MORE_THAN_48_HRS",
    },
  },
  {
    id: "sl-25-percent",
    title: "Sleeper Class (48h–12h Window)",
    badge: "25% Slab",
    input: {
      ticketClass: "SL",
      ticketFare: 980,
      passengerCount: 2,
      ticketStatus: "CNF",
      quota: "GN",
      timing: "BETWEEN_48_AND_12_HRS",
    },
  },
  {
    id: "wl-clerkage",
    title: "Waitlist Ticket (Auto-Charted)",
    badge: "₹60 Clerkage",
    input: {
      ticketClass: "3A",
      ticketFare: 1450,
      passengerCount: 1,
      ticketStatus: "WL",
      quota: "GN",
      timing: "MORE_THAN_48_HRS",
    },
  },
  {
    id: "delayed-tdr",
    title: "Train Delayed > 3 Hours (TDR)",
    badge: "100% Full Refund",
    input: {
      ticketClass: "2A",
      ticketFare: 3900,
      passengerCount: 2,
      ticketStatus: "CNF",
      quota: "GN",
      timing: "TRAIN_DELAYED_3HRS",
    },
  },
];

export default function RefundCalculatorClient() {
  const searchParams = useSearchParams();
  const initialPnr = searchParams.get("pnr") || "";

  // State
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");
  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [pnrLoading, setPnrLoading] = useState(false);
  const [pnrError, setPnrError] = useState<string | null>(null);
  const [detectedPnrTrain, setDetectedPnrTrain] = useState<string | null>(null);

  // SMS Text parsing state
  const [smsText, setSmsText] = useState("");
  const [smsParsedFeedback, setSmsParsedFeedback] = useState<string | null>(
    null,
  );

  // Core Calculator Inputs
  const [ticketClass, setTicketClass] = useState<TravelClass>("3A");
  const [ticketFare, setTicketFare] = useState<number>(2700);
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [ticketStatus, setTicketStatus] = useState<TicketStatusType>("CNF");
  const [quota, setQuota] = useState<BookingQuota>("GN");
  const [timing, setTiming] = useState<CancellationTiming>("MORE_THAN_48_HRS");

  // Accordion toggle
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showTdrGuide, setShowTdrGuide] = useState(false);

  // Auto-fetch if PNR passed in query parameters
  useEffect(() => {
    if (initialPnr && /^\d{10}$/.test(initialPnr)) {
      handlePnrLookup(initialPnr);
    }
  }, [initialPnr]);

  async function handlePnrLookup(pnrToFetch?: string) {
    const target = (pnrToFetch || pnrInput).trim();
    if (!/^\d{10}$/.test(target)) {
      setPnrError("Please enter a valid 10-digit Indian Railways PNR number.");
      return;
    }

    setPnrLoading(true);
    setPnrError(null);
    setDetectedPnrTrain(null);

    try {
      const res = await fetch(`/api/erail/pnrStatus?pnr=${target}`, {
        cache: "no-store",
      });
      const json: PnrApiResponse = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(
          json.error ||
            "Could not fetch details for this PNR. You can use manual entry below.",
        );
      }

      const parsedInput = parsePnrDataToRefundInput(json.data);
      setTicketClass(parsedInput.ticketClass);
      setTicketFare(parsedInput.ticketFare);
      setPassengerCount(parsedInput.passengerCount);
      setTicketStatus(parsedInput.ticketStatus);
      setQuota(parsedInput.quota);
      setTiming(parsedInput.timing);

      setDetectedPnrTrain(
        `${json.data.trainNumber || ""} ${json.data.trainName || "Train"} · ${json.data.sourceStation || ""} → ${json.data.destinationStation || ""}`,
      );
    } catch (err) {
      setPnrError(
        err instanceof Error ? err.message : "Failed to load PNR data.",
      );
    } finally {
      setPnrLoading(false);
    }
  }

  function handleSmsParse() {
    if (!smsText.trim()) return;
    const parsed = parseSmsOrTicketText(smsText);
    let detectedPieces = [];

    if (parsed.pnr) {
      setPnrInput(parsed.pnr);
      detectedPieces.push(`PNR: ${parsed.pnr}`);
    }
    if (parsed.journeyClass) {
      setTicketClass(parsed.journeyClass);
      detectedPieces.push(`Class: ${parsed.journeyClass}`);
    }
    if (parsed.fare && parsed.fare > 0) {
      setTicketFare(parsed.fare);
      detectedPieces.push(`Fare: ₹${parsed.fare}`);
    }
    if (parsed.passengerCount) {
      setPassengerCount(parsed.passengerCount);
      detectedPieces.push(`Pax: ${parsed.passengerCount}`);
    }
    if (parsed.quota) {
      setQuota(parsed.quota);
      detectedPieces.push(`Quota: ${parsed.quota}`);
    }
    if (parsed.ticketStatus) {
      setTicketStatus(parsed.ticketStatus);
      detectedPieces.push(`Status: ${parsed.ticketStatus}`);
    }

    if (detectedPieces.length > 0) {
      setSmsParsedFeedback(`Extracted: ${detectedPieces.join(", ")}`);
      setTimeout(() => setSmsParsedFeedback(null), 6000);
    } else {
      setSmsParsedFeedback(
        "Could not find standard IRCTC fields. Try manual selection below.",
      );
      setTimeout(() => setSmsParsedFeedback(null), 4000);
    }
  }

  function applyPreset(preset: PresetScenario) {
    setTicketClass(preset.input.ticketClass);
    setTicketFare(preset.input.ticketFare);
    setPassengerCount(preset.input.passengerCount);
    setTicketStatus(preset.input.ticketStatus);
    setQuota(preset.input.quota);
    setTiming(preset.input.timing);
    setDetectedPnrTrain(null);
    setPnrError(null);
  }

  // Calculate live results
  const calculationResult = useMemo(() => {
    return calculateRefund({
      ticketClass,
      ticketFare,
      passengerCount,
      ticketStatus,
      quota,
      timing,
    });
  }, [ticketClass, ticketFare, passengerCount, ticketStatus, quota, timing]);

  const classMeta = CLASS_METADATA[ticketClass] || CLASS_METADATA["3A"];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
          <Calculator size={13} />
          IRCTC Official Refund Engine
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Railway Ticket Cancellation &amp; Refund Calculator
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          Find out exactly how much money Indian Railways will refund to your
          bank account before you cancel. Analyze every rupee deducted, cite
          official Railway Board rules, and beat the next deduction slab.
        </p>

        {/* QUICK PRESET SCENARIO CHIPS */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            Try Scenarios:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs transition-all hover:border-violet hover:bg-surface-alt active:scale-98"
            >
              <span>{p.title}</span>
              <span className="rounded-md bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* DUAL MODE SELECTOR (SMART ANALYZER vs MANUAL) */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-2xl border border-border bg-surface-alt p-1.5 shadow-2xs">
          <button
            onClick={() => setActiveTab("smart")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "smart"
                ? "bg-white text-violet shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Sparkles size={14} />
            Smart Auto-Analysis (PNR / SMS)
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "manual"
                ? "bg-white text-violet shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Calculator size={14} />
            Interactive Manual Calculator
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: INPUT CONTROLS (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {activeTab === "smart" ? (
            /* SMART TAB: PNR & SMS TEXT INPUT */
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <Search size={16} className="text-violet" />
                Analyze Live PNR or IRCTC Message
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Enter your 10-digit PNR to fetch live coach, quota, and chart
                details, or paste your IRCTC SMS/WhatsApp confirmation.
              </p>

              {/* PNR INPUT */}
              <div className="mt-4 flex gap-2">
                <input
                  value={pnrInput}
                  onChange={(e) =>
                    setPnrInput(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Enter 10-digit PNR"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 font-mono text-[14px] text-ink outline-none transition-colors focus:border-violet focus:ring-3 focus:ring-violet-ring"
                />
                <button
                  type="button"
                  onClick={() => handlePnrLookup()}
                  disabled={pnrLoading || pnrInput.length !== 10}
                  className="shrink-0 rounded-xl bg-violet px-4 py-2.5 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-dark disabled:opacity-50"
                >
                  {pnrLoading ? "Fetching…" : "Fetch PNR"}
                </button>
              </div>

              {pnrError && (
                <div className="mt-2.5 rounded-lg border border-signal-red/30 bg-signal-red-soft px-3 py-2 text-xs text-signal-red">
                  {pnrError}
                </div>
              )}

              {detectedPnrTrain && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-signal-green/30 bg-signal-green-soft px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-mono font-medium text-ink">
                    <Train size={14} className="text-signal-green" />
                    <span>{detectedPnrTrain}</span>
                  </div>
                  <span className="font-mono text-[11px] text-signal-green font-semibold">
                    ✓ Parsed Live
                  </span>
                </div>
              )}

              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-white px-3 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                  Or Paste Booking SMS / WhatsApp
                </span>
              </div>

              {/* SMS / TICKET TEXT AREA */}
              <div className="space-y-2">
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="e.g. PNR: 2456789012, Trn: 12952, DOJ: 22-09-2026, 3A, CNF/B2/45, Fare: 2700, 2 Pax..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-surface-alt/50 p-3 font-mono text-xs text-ink outline-none transition-colors focus:border-violet focus:bg-white focus:ring-3 focus:ring-violet-ring"
                />
                <button
                  type="button"
                  onClick={handleSmsParse}
                  disabled={!smsText.trim()}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs hover:border-violet hover:bg-surface-alt active:scale-98 disabled:opacity-50"
                >
                  <Send size={12} className="text-violet" />
                  Auto-Detect from Text
                </button>
              </div>

              {smsParsedFeedback && (
                <div className="mt-2.5 rounded-lg border border-violet/20 bg-violet/5 px-3 py-2 text-xs font-mono text-violet">
                  {smsParsedFeedback}
                </div>
              )}

              {/* QUICK ADJUSTMENT SECTION IN SMART TAB */}
              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Cancellation Timing
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    When are you cancelling?
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    {
                      key: "MORE_THAN_48_HRS",
                      label: "> 48 Hours Prior",
                      badge: "Flat Fee",
                    },
                    {
                      key: "BETWEEN_48_AND_12_HRS",
                      label: "48h – 12h Prior",
                      badge: "25% Slab",
                    },
                    {
                      key: "BETWEEN_12_AND_4_HRS",
                      label: "12h – 4h Prior",
                      badge: "50% Slab",
                    },
                    {
                      key: "LESS_THAN_4_HRS_OR_CHARTED",
                      label: "< 4h / Charted",
                      badge: "0% Refund",
                    },
                    {
                      key: "TRAIN_CANCELLED",
                      label: "Train Cancelled",
                      badge: "100% Refund",
                    },
                    {
                      key: "TRAIN_DELAYED_3HRS",
                      label: "Delayed > 3h (TDR)",
                      badge: "100% Refund",
                    },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTiming(t.key as CancellationTiming)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        timing === t.key
                          ? "border-violet bg-violet-soft/30 text-ink ring-2 ring-violet/20"
                          : "border-border bg-white text-ink hover:border-violet/40 hover:bg-surface-alt"
                      }`}
                    >
                      <span className="text-xs font-semibold">{t.label}</span>
                      <span className="mt-0.5 font-mono text-[10px] text-ink-muted">
                        {t.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* MANUAL CONTROLS CARD (ALWAYS VISIBLE IN MANUAL TAB, OR EXPANDABLE) */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <Calculator size={16} className="text-violet" />
                Ticket Parameters
              </h2>
              {activeTab === "smart" && (
                <span className="font-mono text-[11px] text-ink-muted">
                  Auto-populated from analyzer
                </span>
              )}
            </div>

            <div className="mt-5 space-y-5">
              {/* CLASS SELECTOR */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                  Travel Class
                </label>
                <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                  {(
                    [
                      "1A",
                      "EC",
                      "2A",
                      "3A",
                      "3E",
                      "CC",
                      "SL",
                      "2S",
                    ] as TravelClass[]
                  ).map((c) => {
                    const isSelected = ticketClass === c;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setTicketClass(c);
                          // Suggest realistic fare if default
                          if (ticketFare === 2700 || ticketFare === 0) {
                            setTicketFare(
                              CLASS_METADATA[c].typicalFarePerPax *
                                passengerCount,
                            );
                          }
                        }}
                        className={`rounded-xl border py-2 text-center transition-all ${
                          isSelected
                            ? "border-violet bg-violet text-white shadow-2xs font-bold"
                            : "border-border bg-white text-ink hover:border-violet/30 hover:bg-surface-alt font-medium text-xs"
                        }`}
                      >
                        <div className="text-xs">{c}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Selected:{" "}
                  <span className="font-semibold text-ink">
                    {classMeta.name}
                  </span>{" "}
                  · Flat cancellation fee: ₹{classMeta.flatCancellationFee}/pax{" "}
                  {classMeta.isAc ? "(+ 5% GST)" : "(No GST)"}
                </p>
              </div>

              {/* TICKET STATUS & BOOKING QUOTA */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Current Ticket Status
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {[
                      { key: "CNF", label: "Confirmed (CNF)" },
                      { key: "RAC", label: "RAC" },
                      { key: "WL", label: "Waitlisted (WL)" },
                      { key: "PARTIAL", label: "Partial (CNF+WL)" },
                    ].map((s) => (
                      <button
                        key={s.key}
                        onClick={() =>
                          setTicketStatus(s.key as TicketStatusType)
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${
                          ticketStatus === s.key
                            ? "border-violet bg-violet-soft/40 text-ink ring-2 ring-violet/20 font-semibold"
                            : "border-border bg-white text-ink hover:border-violet/30"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Booking Quota
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {[
                      { key: "GN", label: "General Quota" },
                      { key: "TQ", label: "Tatkal (TQ)" },
                      { key: "PT", label: "Premium Tatkal" },
                      { key: "LD", label: "Ladies (LD)" },
                    ].map((q) => (
                      <button
                        key={q.key}
                        onClick={() => setQuota(q.key as BookingQuota)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${
                          quota === q.key
                            ? "border-violet bg-violet-soft/40 text-ink ring-2 ring-violet/20 font-semibold"
                            : "border-border bg-white text-ink hover:border-violet/30"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TIMING SELECTION (IF MANUAL TAB) */}
              {activeTab === "manual" && (
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Cancellation Timing
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      {
                        key: "MORE_THAN_48_HRS",
                        label: "> 48 Hours Prior",
                        badge: "Flat Fee",
                      },
                      {
                        key: "BETWEEN_48_AND_12_HRS",
                        label: "48h – 12h Prior",
                        badge: "25% Slab",
                      },
                      {
                        key: "BETWEEN_12_AND_4_HRS",
                        label: "12h – 4h Prior",
                        badge: "50% Slab",
                      },
                      {
                        key: "LESS_THAN_4_HRS_OR_CHARTED",
                        label: "< 4h / Charted",
                        badge: "0% Refund",
                      },
                      {
                        key: "TRAIN_CANCELLED",
                        label: "Train Cancelled",
                        badge: "100% Refund",
                      },
                      {
                        key: "TRAIN_DELAYED_3HRS",
                        label: "Delayed > 3h (TDR)",
                        badge: "100% Refund",
                      },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTiming(t.key as CancellationTiming)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          timing === t.key
                            ? "border-violet bg-violet-soft/30 text-ink ring-2 ring-violet/20"
                            : "border-border bg-white text-ink hover:border-violet/40 hover:bg-surface-alt"
                        }`}
                      >
                        <span className="text-xs font-semibold">{t.label}</span>
                        <span className="mt-0.5 font-mono text-[10px] text-ink-muted">
                          {t.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSENGERS & TICKET FARE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Number of Passengers
                  </label>
                  <div className="mt-2 flex items-center rounded-xl border border-border bg-white p-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, passengerCount - 1);
                        setPassengerCount(next);
                        setTicketFare(classMeta.typicalFarePerPax * next);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-alt font-mono text-sm font-bold text-ink hover:bg-white"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono text-sm font-semibold text-ink">
                      {passengerCount}{" "}
                      {passengerCount === 1 ? "Passenger" : "Passengers"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(6, passengerCount + 1);
                        setPassengerCount(next);
                        setTicketFare(classMeta.typicalFarePerPax * next);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-alt font-mono text-sm font-bold text-ink hover:bg-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                    Total Ticket Fare Paid (₹)
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-ink-muted">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={ticketFare || ""}
                      onChange={(e) =>
                        setTicketFare(
                          Math.max(0, parseInt(e.target.value, 10) || 0),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-white py-2 pl-8 pr-4 font-mono text-sm font-semibold text-ink outline-none transition-colors focus:border-violet focus:ring-3 focus:ring-violet-ring"
                      placeholder="e.g. 2700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REFUND STATEMENT / RECEIPT CARD (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* THE RECEIPT */}
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-md">
            {/* TOP HEADER */}
            <div className="border-b border-border bg-gradient-to-br from-white to-surface-alt p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                  <Receipt size={14} className="text-violet" />
                  Refund Statement
                </div>
                <div
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    calculationResult.refundPercentage >= 75
                      ? "bg-signal-green-soft text-signal-green"
                      : calculationResult.refundPercentage > 0
                        ? "bg-signal-amber-soft text-signal-amber"
                        : "bg-signal-red-soft text-signal-red"
                  }`}
                >
                  {calculationResult.refundPercentage}% Refunded
                </div>
              </div>

              {/* BIG NUMBERS */}
              <div className="mt-4">
                <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                  Net Refund Payable to Bank
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                    ₹{calculationResult.netRefundAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="font-mono text-xs text-ink-muted">
                    of ₹
                    {calculationResult.totalFarePaid.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full transition-all duration-500 ${
                      calculationResult.refundPercentage >= 75
                        ? "bg-signal-green"
                        : calculationResult.refundPercentage > 0
                          ? "bg-signal-amber"
                          : "bg-signal-red"
                    }`}
                    style={{ width: `${calculationResult.refundPercentage}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-dim">
                  <span>₹{calculationResult.netRefundAmount} to Bank</span>
                  <span>₹{calculationResult.totalDeductions} Deducted</span>
                </div>
              </div>
            </div>

            {/* ITEMIZED BREAKDOWN */}
            <div className="p-5 sm:p-6">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Itemized Deductions
              </h3>

              <div className="mt-3 divide-y divide-border-soft">
                {/* BASE FARE */}
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-ink-muted">Total Fare Paid</span>
                  <span className="font-mono font-semibold text-ink">
                    ₹{calculationResult.totalFarePaid.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* DEDUCTIONS */}
                {calculationResult.deductionBreakdown.length > 0 ? (
                  calculationResult.deductionBreakdown.map((item) => (
                    <div key={item.id} className="py-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-signal-red">
                          <span>− {item.label}</span>
                        </div>
                        <span className="font-mono font-semibold text-signal-red">
                          −₹{item.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-dim">
                        {item.explanation}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-xs text-signal-green">
                    ✓ Zero cancellation deductions applied (100% full refund)
                  </div>
                )}

                {/* NET REFUND ROW */}
                <div className="flex items-center justify-between pt-3 text-sm font-bold">
                  <span className="text-ink">Net Bank Refund</span>
                  <span className="font-mono text-base text-signal-green">
                    ₹{calculationResult.netRefundAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* REFUND TIMELINE & DESTINATION */}
              <div className="mt-5 rounded-2xl border border-border bg-surface-alt p-3.5 text-xs text-ink-muted">
                <div className="flex items-center gap-2 font-mono font-semibold text-ink">
                  <CreditCard size={14} className="text-violet" />
                  <span>Credit Destination &amp; Timeline</span>
                </div>
                <p className="mt-1 leading-relaxed text-[11.5px]">
                  {calculationResult.refundTimeline}. Auto-credited to the
                  original UPI VPA, Credit/Debit card, or NetBanking account
                  used during booking.
                </p>
                <p className="mt-1 text-[10.5px] text-ink-dim">
                  * Note: IRCTC convenience fee (₹15–₹30) and gateway charges
                  are non-refundable under all cancellation rules.
                </p>
              </div>

              {/* WARNING CALLOUT IF TATKAL CNF OR 0% */}
              {quota === "TQ" && ticketStatus === "CNF" && (
                <div className="mt-4 rounded-xl border border-signal-red/30 bg-signal-red-soft p-3 text-xs text-signal-red">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={14} />
                    Confirmed Tatkal tickets carry ZERO refund!
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink">
                    Under IRCTC Tatkal Scheme rules, 100% of the fare is
                    forfeited. Do not cancel unless your train is delayed &gt; 3
                    hours (file a TDR instead for a 100% refund).
                  </p>
                </div>
              )}

              {/* NEXT SLAB WARNING (ACT FAST TO SAVE MONEY) */}
              {calculationResult.nextSlabWarning && (
                <div className="mt-4 rounded-xl border border-signal-amber/40 bg-signal-amber-soft p-3 text-xs text-signal-amber">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock size={14} />
                    Act Fast: Save ₹
                    {calculationResult.nextSlabWarning.potentialExtraLoss}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink">
                    {calculationResult.nextSlabWarning.advice}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TDR EXEMPTION ASSISTANT BUTTON */}
          <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
            <button
              onClick={() => setShowTdrGuide(!showTdrGuide)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-violet" />
                <div>
                  <div className="text-xs font-semibold text-ink">
                    Want 100% refund on zero-refund tickets?
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Learn when you are legally entitled to a full TDR refund
                  </div>
                </div>
              </div>
              {showTdrGuide ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {showTdrGuide && (
              <div className="mt-3 border-t border-border pt-3 text-xs space-y-2 text-ink-muted">
                <p className="font-semibold text-ink">
                  You can claim a 100% refund (even on Tatkal or post-charting)
                  if:
                </p>
                <ul className="list-disc space-y-1 pl-4 text-[11.5px]">
                  <li>
                    <strong className="text-ink">
                      Train delayed &gt; 3 hours
                    </strong>{" "}
                    at your boarding station and you choose not to travel.
                  </li>
                  <li>
                    <strong className="text-ink">AC Failure:</strong> If AC in
                    your coach wasn't functioning (claim difference between AC
                    &amp; SL).
                  </li>
                  <li>
                    <strong className="text-ink">Train Diverted:</strong> Train
                    route changed and doesn't halt at your destination.
                  </li>
                  <li>
                    <strong className="text-ink">Coach not attached:</strong>{" "}
                    Reserved coach was detached and alternate berth not
                    provided.
                  </li>
                </ul>
                <div className="mt-2 rounded-lg bg-surface-alt p-2.5 text-[11px]">
                  <strong className="text-ink">How to file on IRCTC:</strong>{" "}
                  Log in to IRCTC &gt; My Transactions &gt; Booked Ticket
                  History &gt; Select Ticket &gt; Click{" "}
                  <em>&quot;File TDR&quot;</em> &gt; Choose appropriate reason
                  before actual departure!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MASTER IRCTC CANCELLATION RULES TABLE */}
      <section className="mt-16">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
            Authoritative Reference
          </div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Complete IRCTC Railway Cancellation Slabs Matrix
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Official Indian Railways cancellation rules as per Ministry of
            Railways Gazette Notification.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-alt font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Coach Class</th>
                <th className="px-4 py-3 font-semibold">&gt; 48 Hours Prior</th>
                <th className="px-4 py-3 font-semibold">48h – 12h Prior</th>
                <th className="px-4 py-3 font-semibold">12h – 4h Prior</th>
                <th className="px-4 py-3 font-semibold">
                  &lt; 4h / Chart Prepared
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft font-mono text-[11.5px]">
              {RULES_REFERENCE_TABLE.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-surface-alt/50 transition-colors"
                >
                  <td className="px-4 py-3 font-sans font-semibold text-ink">
                    <div>{row.classCode}</div>
                    <div className="font-sans text-[11px] font-normal text-ink-muted">
                      {row.className}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-signal-green font-medium">
                    {row.moreThan48h}
                  </td>
                  <td className="px-4 py-3 text-signal-amber font-medium">
                    {row.between48And12h}
                  </td>
                  <td className="px-4 py-3 text-signal-amber font-medium">
                    {row.between12And4h}
                  </td>
                  <td className="px-4 py-3 text-signal-red font-medium">
                    {row.lessThan4h}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEO FAQ SECTION */}
      <section className="mt-16">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
            Frequently Asked Questions
          </div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Railway Ticket Cancellation &amp; Refund FAQs
          </h2>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          {[
            {
              q: "How much does IRCTC deduct for cancelling a 3rd AC (3A) ticket?",
              a: "For 3A, 3E, and Chair Car (CC), if cancelled more than 48 hours before scheduled departure, IRCTC deducts a flat statutory fee of ₹180 + 5% GST = ₹189 per passenger. If cancelled between 48 and 12 hours prior, 25% of the fare is deducted (min ₹189). Between 12 and 4 hours prior, 50% is deducted. Under 4 hours or after chart preparation, zero refund is granted.",
            },
            {
              q: "Can I get a refund if I cancel a Confirmed Tatkal ticket?",
              a: "No. Confirmed Tatkal tickets carry ZERO refund upon passenger cancellation under IRCTC rules (100% fare is forfeited). The only exceptions where you can receive a 100% refund are if the train is cancelled by Indian Railways, or if the train is delayed by more than 3 hours at your boarding station and you file an online TDR before actual departure.",
            },
            {
              q: "What happens to waitlisted (WL) e-tickets after chart preparation?",
              a: "Fully waitlisted e-tickets (where all passengers on the PNR remain in WL after chart preparation) are automatically cancelled by IRCTC. You do NOT need to cancel them manually. IRCTC deducts a flat clerkage charge of ₹60 per passenger (+ 5% GST for AC classes) and refunds the balance directly to your bank/UPI account within 3 to 5 business days.",
            },
            {
              q: "How long does IRCTC take to refund money to UPI or Bank Accounts?",
              a: "Refunds for standard cancelled e-tickets are initiated immediately by IRCTC and typically credit to your original payment method (Google Pay, PhonePe, Paytm UPI, Debit/Credit Card, or NetBanking) within 3 to 5 working days. TDR cases require zonal railway verification and usually take 30 to 60 days.",
            },
            {
              q: "What is the cancellation charge for RAC tickets?",
              a: "RAC (Reservation Against Cancellation) tickets can be cancelled online up to 30 minutes before the scheduled departure of the train. A flat clerkage charge of ₹60 per passenger (+ 5% GST for AC classes = ₹63) is deducted, and the remaining fare is 100% refunded to your bank account.",
            },
            {
              q: "Why is GST charged on cancellation fee?",
              a: "As per Ministry of Finance GST guidelines, cancellation charges for air-conditioned classes (1A, 2A, 3A, 3E, CC, EC) are treated as supply of service and attract 5% Goods and Services Tax (GST). Non-AC classes (Sleeper and Second Sitting 2S) are exempt from GST.",
            },
          ].map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-white transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-xs font-semibold text-ink sm:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-violet" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border-soft px-5 py-4 text-xs leading-relaxed text-ink-muted sm:text-[13px]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* RELATED CANCELLATION & REFUND GUIDES */}
      <RelatedBlogGuides
        title="Cancellation Rules & Refund Guides"
        subtitle="Learn about statutory IRCTC cancellation slabs, TDR filing procedures, and passenger rights."
        guides={[
          {
            slug: "irctc-ticket-cancellation-charges-refund-calculator-guide",
            title:
              "IRCTC Ticket Cancellation Charges Explained: Slabs, GST & Tatkal",
            excerpt:
              "Statutory rules for 48h, 12h, and 4h cancellation windows, clerkage charges, and Tatkal TDR rules.",
            category: "Tips",
            readTime: "10 min read",
          },
          {
            slug: "train-ticket-cancellation-refund-rules-2026",
            title:
              "Train Ticket Cancellation & Refund Rules 2026: What You Actually Get Back",
            excerpt:
              "Breakdown of net refund percentages across Sleeper, 3A, 2A, and auto-cancelled waitlist tickets.",
            category: "Tips",
            readTime: "7 min read",
          },
          {
            slug: "train-passenger-rights-you-should-know",
            title:
              "Train Passenger Rights in India That Most People Don't Know About",
            excerpt:
              "Full refunds for delayed trains, meal compensations, TTE berth re-allotment, and free medical care.",
            category: "Tips",
            readTime: "8 min read",
          },
        ]}
      />
    </main>
  );
}
