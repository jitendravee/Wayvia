"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  CheckCircle2,
  Copy,
  Share2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Train,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  ARBITRAGE_PRESETS,
  VERIFIED_ARBITRAGE_DEALS,
  ArbitrageOpportunity,
  ArbitrageRoutePreset,
  analyzeClassArbitrage,
} from "@/lib/fare-arbitrage/fareArbitrageEngine";
import type { BetweenStationEntry } from "@/lib/erail/prettify";
import type { TrainFareEntry } from "@/lib/erail/fare";

export default function FareArbitrageClient() {
  const [activePreset, setActivePreset] = useState<ArbitrageRoutePreset>(
    ARBITRAGE_PRESETS[0],
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  // Live Erail scanning state
  const [fromInput, setFromInput] = useState<string>(
    ARBITRAGE_PRESETS[0].fromCode,
  );
  const [toInput, setToInput] = useState<string>(ARBITRAGE_PRESETS[0].toCode);
  const [isScanningErail, setIsScanningErail] = useState<boolean>(false);
  const [scannedTrains, setScannedTrains] = useState<
    BetweenStationEntry[] | null
  >(null);
  const [detectedDeals, setDetectedDeals] = useState<ArbitrageOpportunity[]>(
    VERIFIED_ARBITRAGE_DEALS,
  );
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Calculator custom state
  const [calcTrainNo, setCalcTrainNo] = useState<string>("12392");
  const [calcSlCost, setCalcSlCost] = useState<number>(595);
  const [calcAcCost, setCalcAcCost] = useState<number>(985);
  const [calcPassengers, setCalcPassengers] = useState<number>(2);

  // Filter deals
  const displayedDeals = useMemo(() => {
    return detectedDeals.filter((deal) => {
      if (selectedFilter === "ALL") return true;
      return deal.type === selectedFilter;
    });
  }, [detectedDeals, selectedFilter]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ArbitrageRoutePreset) => {
    setActivePreset(preset);
    setFromInput(preset.fromCode);
    setToInput(preset.toCode);
  };

  // Scan live Erail trains and test for live fare arbitrage
  const handleScanErail = async () => {
    const f = fromInput.trim().toUpperCase();
    const t = toInput.trim().toUpperCase();
    if (!f || !t) return;

    setIsScanningErail(true);
    setScanStatus(
      `Querying erail.in network for all direct services between ${f} and ${t}...`,
    );

    try {
      const res = await fetch(`/api/erail/betweenStations?from=${f}&to=${t}`);
      const data = await res.json();

      if (
        data &&
        data.success &&
        Array.isArray(data.data) &&
        data.data.length > 0
      ) {
        const trains = data.data as BetweenStationEntry[];
        setScannedTrains(trains);
        setScanStatus(
          `Found ${trains.length} trains. Analyzing live fare tables for secret class upgrade gaps...`,
        );

        // Check first 3 trains for live class arbitrage
        const newOpportunities: ArbitrageOpportunity[] = [
          ...VERIFIED_ARBITRAGE_DEALS,
        ];
        const candidateTrains = trains.slice(0, 3);

        for (const ct of candidateTrains) {
          try {
            const fareRes = await fetch(
              `/api/erail/fare?trainNo=${ct.train_base.train_no}&from=${ct.train_base.from_stn_code}&to=${ct.train_base.to_stn_code}`,
            );
            const fareData = await fareRes.json();
            if (fareData && fareData.success && Array.isArray(fareData.fares)) {
              const liveArb = analyzeClassArbitrage(
                ct.train_base.train_no,
                ct.train_base.train_name,
                ct.train_base.from_stn_code,
                ct.train_base.to_stn_code,
                ct.train_base.from_time,
                ct.train_base.to_time,
                ct.train_base.travel_time,
                fareData.fares,
              );
              if (liveArb) {
                newOpportunities.unshift(liveArb);
              }
            }
          } catch {
            // continue scanning next train
          }
        }

        setDetectedDeals(newOpportunities);
        setScanStatus(
          `Analysis complete! Identified ${newOpportunities.length} arbitrage opportunities on this corridor.`,
        );
      } else {
        setScanStatus(
          `No direct train services found on erail for ${f} → ${t}.`,
        );
      }
    } catch {
      setScanStatus(
        "Connection to erail servers timed out. Displaying verified algorithmic presets.",
      );
    } finally {
      setIsScanningErail(false);
    }
  };

  // Copy deal action to clipboard
  const handleCopyDeal = (deal: ArbitrageOpportunity) => {
    const text = `💰 Wayvia Railway Arbitrage Alert:
${deal.title}
Train: ${deal.trainName} (#${deal.trainNo}) | ${deal.fromCode} → ${deal.toCode}
Baseline: ${deal.baselineOption.description} (₹${deal.baselineOption.cost})
Smart Hack: ${deal.arbitrageOption.description} (₹${deal.arbitrageOption.cost})
Advantage: ${deal.valueSummary}

Discovered on Wayvia: https://wayvia.xyz/fare-arbitrage`;

    navigator.clipboard.writeText(text);
    setCopiedId(deal.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // WhatsApp 1-click share
  const handleWhatsAppShare = (deal: ArbitrageOpportunity) => {
    const text = `💰 *Wayvia Railway Fare Arbitrage Deal!*
🚆 *${deal.title}*
Train: ${deal.trainName} (#${deal.trainNo})
Route: ${deal.fromCode} ➔ ${deal.toCode} (${deal.depTime} - ${deal.arrTime})

❌ *Standard Booking:* ${deal.baselineOption.description} (₹${deal.baselineOption.cost})
✅ *Arbitrage Hack:* ${deal.arbitrageOption.description} (₹${deal.arbitrageOption.cost})

💡 *Why It Works:*
${deal.valueSummary}

Check full hack breakdown: https://wayvia.xyz/fare-arbitrage`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Custom calculator metrics
  const calcDiffPerPerson = calcAcCost - calcSlCost;
  const calcTotalDiff = calcDiffPerPerson * calcPassengers;
  const isWorthIt = calcDiffPerPerson <= 450;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50/70 via-slate-50 to-white text-slate-900 pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-purple-100/60">
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold mb-4 tracking-wide uppercase">
            <Coins className="w-3.5 h-3.5 text-purple-600" />
            Live Erail Fare & Multimodal Quota Intelligence
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 font-display">
            Telescopic{" "}
            <span className="bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
              Fare Arbitrage
            </span>{" "}
            & Secret Upgrade Engine
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed mb-8">
            Stop overpaying on IRCTC. Indian Railways uses complex telescopic
            distance slabs, dynamic surge multipliers, and segmented quotas. Our
            engine scours live erail data to discover secret ₹45 AC upgrades,
            GNWL quota unlocks, dynamic pricing circuit breakers, and confirmed
            multimodal bus alternatives.
          </p>

          {/* Value Props Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-purple-100 shadow-sm shadow-purple-500/5">
              <div className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Secret AC
                Upgrade
              </div>
              <div className="text-xl font-bold text-slate-900">
                Tatkal SL vs 3E
              </div>
              <div className="text-[11px] text-slate-500">
                Upgrade for as low as ₹200
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-purple-100 shadow-sm shadow-purple-500/5">
              <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Quota
                Unlocking
              </div>
              <div className="text-xl font-bold text-slate-900">
                +65% Odds Boost
              </div>
              <div className="text-[11px] text-slate-500">
                Origin Shift from PQWL to GNWL
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-purple-100 shadow-sm shadow-purple-500/5">
              <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" /> Surge
                Breaker
              </div>
              <div className="text-xl font-bold text-slate-900">
                Save ₹800+ Cash
              </div>
              <div className="text-[11px] text-slate-500">
                Avoid 1.5x Rajdhani dynamic slabs
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-purple-100 shadow-sm shadow-purple-500/5">
              <div className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-teal-600" /> Bus & Multimodal
              </div>
              <div className="text-xl font-bold text-slate-900">
                100% CNF Berth
              </div>
              <div className="text-[11px] text-slate-500">
                AC Sleeper bus fallback
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-12">
        {/* Corridor Scanner Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Popular High-Traffic Corridors
              </span>
              <div className="flex flex-wrap gap-2">
                {ARBITRAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      activePreset.id === preset.id
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Inputs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <input
                  type="text"
                  placeholder="From (e.g. NDLS)"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value.toUpperCase())}
                  className="w-24 sm:w-28 px-3 py-1.5 text-xs font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
                />
                <span className="text-slate-400 font-bold px-1">→</span>
                <input
                  type="text"
                  placeholder="To (e.g. BSB)"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value.toUpperCase())}
                  className="w-24 sm:w-28 px-3 py-1.5 text-xs font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
                />
              </div>

              <button
                onClick={handleScanErail}
                disabled={isScanningErail}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shadow-purple-600/30 shrink-0"
              >
                {isScanningErail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                {isScanningErail ? "Scanning Erail..." : "Scan Arbitrage"}
              </button>
            </div>
          </div>

          {/* Scanner Status Message */}
          {scanStatus && (
            <div className="mt-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{scanStatus}</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "All Arbitrage Deals" },
              { id: "CLASS_UPGRADE", label: "Secret AC Upgrades" },
              { id: "ORIGIN_SHIFT", label: "Origin Quota Unlocks" },
              { id: "SURGE_BREAKER", label: "Dynamic Surge Breakers" },
              { id: "BUS_MULTIMODAL", label: "Bus & Multimodal Arbitrage" },
              { id: "CATERING_OPTOUT", label: "Meal Opt-Outs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedFilter === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{displayedDeals.length}</strong> high-yield
            opportunities
          </div>
        </div>

        {/* Arbitrage Deal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedDeals.map((deal) => {
            const isActionExpanded = expandedActionId === deal.id;
            const isCopied = copiedId === deal.id;

            return (
              <div
                key={deal.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        deal.badgeColor === "purple"
                          ? "bg-purple-100 text-purple-800"
                          : deal.badgeColor === "emerald"
                            ? "bg-emerald-100 text-emerald-800"
                            : deal.badgeColor === "amber"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {deal.badge}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{deal.trainNo}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-purple-600 transition">
                    {deal.title}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                    <Train className="w-3.5 h-3.5 text-slate-400" />
                    <span>{deal.trainName}</span>
                    <span>·</span>
                    <span>
                      {deal.fromCode} → {deal.toCode}
                    </span>
                    <span>·</span>
                    <span>{deal.travelTime}</span>
                  </div>

                  {/* Comparative 2-Way Box */}
                  <div className="mt-5 grid grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    {/* Baseline */}
                    <div className="border-r border-slate-200 pr-3">
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Baseline Trap
                      </div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {deal.baselineOption.description}
                      </div>
                      <div className="text-base font-extrabold text-slate-900 mt-1.5">
                        ₹{deal.baselineOption.cost}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Odds: {deal.baselineOption.confirmationOdds}
                      </div>
                    </div>

                    {/* Arbitrage */}
                    <div className="pl-1">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Arbitrage Hack
                      </div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {deal.arbitrageOption.description}
                      </div>
                      <div className="text-base font-extrabold text-emerald-700 mt-1.5">
                        ₹{deal.arbitrageOption.cost}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Odds: {deal.arbitrageOption.confirmationOdds}
                      </div>
                    </div>
                  </div>

                  {/* Value Explanation */}
                  <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    {deal.valueSummary}
                  </p>

                  {/* Accordion Action Steps */}
                  {isActionExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        How to Execute on IRCTC (Step-by-Step):
                      </div>
                      <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1">
                        {deal.actionSteps.map((step, idx) => (
                          <li key={idx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ol>
                      {deal.arbitrageOption.boardingStationRule && (
                        <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium">
                          ℹ️ {deal.arbitrageOption.boardingStationRule}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      setExpandedActionId(isActionExpanded ? null : deal.id)
                    }
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1"
                  >
                    {isActionExpanded ? "Hide Steps" : "How to Book"}
                    {isActionExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyDeal(deal)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {isCopied ? "Copied!" : "Copy Hack"}
                    </button>

                    <button
                      onClick={() => handleWhatsAppShare(deal)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm shadow-emerald-600/30"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Custom Arbitrage Calculator */}
        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold mb-2">
                <Coins className="w-3.5 h-3.5 text-purple-600" />
                Custom Arbitrage Analyzer
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Check Any Train: Sleeper vs 3A Upgrade Analyzer
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Have a specific train in mind? Enter the Tatkal Sleeper fare and
                General 3A/3E fare to test whether taking the AC upgrade is
                mathematically optimal.
              </p>
            </div>

            {/* Result Badge */}
            <div
              className={`rounded-2xl p-4 text-center shrink-0 border transition ${
                isWorthIt
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-slate-100 border-slate-300 text-slate-800"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Upgrade Recommendation
              </div>
              <div className="text-xl font-black mt-0.5">
                {isWorthIt ? "🔥 High-Value Upgrade!" : "Stay on Sleeper"}
              </div>
              <div className="text-xs font-semibold mt-1">
                ₹{calcDiffPerPerson} difference / person
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Train Number
              </label>
              <input
                type="text"
                value={calcTrainNo}
                onChange={(e) => setCalcTrainNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tatkal Sleeper Fare (₹)
              </label>
              <input
                type="number"
                value={calcSlCost}
                onChange={(e) => setCalcSlCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                General 3A / 3E Fare (₹)
              </label>
              <input
                type="number"
                value={calcAcCost}
                onChange={(e) => setCalcAcCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Passengers
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCalcPassengers(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      calcPassengers === num
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span>Per-Passenger Price Gap:</span>
              <span className="font-bold text-slate-900">
                ₹{calcDiffPerPerson}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>
                Total Extra for {calcPassengers} Passenger
                {calcPassengers > 1 ? "s" : ""}:
              </span>
              <span className="font-bold text-slate-900">₹{calcTotalDiff}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-purple-900 font-medium">
              💡 <strong>The Rule of Thumb:</strong> If the gap between Tatkal
              Sleeper and General 3A/3E is under ₹450, always choose 3A. Tatkal
              Sleeper incurs high Tatkal surcharges with zero bedrolls and 4x
              higher cancellation risk, while General 3A guarantees linen,
              temperature control, and superior safety.
            </div>
          </div>
        </section>

        {/* Why Indian Railways Has These Inefficiencies */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Does Fare Arbitrage Exist on Indian Railways?
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Indian Railways is the 4th largest rail network on Earth, running
              on a 70-year-old fare algorithm with modern dynamic pricing
              layered on top. This creates 3 systemic inefficiencies:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-purple-300 font-bold text-sm mb-2">
                1. Telescopic Distance Taper
              </div>
              <p className="text-slate-300">
                The Indian Railway passenger tariff charges ₹/km at a declining
                rate over distance. Extending a ticket by 50 km often only costs
                ₹25, while buying two separate tickets or booking intermediate
                quotas triggers minimum base fare overheads twice.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-emerald-300 font-bold text-sm mb-2">
                2. Asymmetric Quota Allocation
              </div>
              <p className="text-slate-300">
                85% of a train&apos;s berths are locked in the General Quota
                (GNWL) from the origin station. Intermediate stops get assigned
                tiny Pooled Quotas (PQWL) of just 6-12 seats. Shifting your
                origin to the terminal unlocks the massive 400-berth pool.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-amber-300 font-bold text-sm mb-2">
                3. Isolated Dynamic Pricing Slabs
              </div>
              <p className="text-slate-300">
                Rajdhani, Tejas, and Suvidha trains use dynamic pricing that
                surges up to 1.5x. However, standard Superfast Mail/Express
                trains running on the exact same tracks 30 minutes earlier or
                later have fixed statutory price caps!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
