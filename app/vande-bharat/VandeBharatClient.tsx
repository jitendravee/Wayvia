"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Train,
  Zap,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  Utensils,
  ChevronRight,
  Info,
  X,
  Gauge,
  Bed,
  Coins,
  Coffee,
  CheckCircle2,
  Calendar,
  MapPin,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import {
  VANDE_BHARAT_CATALOGUE,
  SLEEPER_COMPARISON_SPECS,
  CATERING_MENU,
  VandeBharatRouteSummary,
} from "@/lib/vande-bharat/vandeBharatEngine";
import type { RouteStop } from "@/lib/erail/prettify";
import type { TrainFareEntry } from "@/lib/erail/fare";

export default function VandeBharatClient() {
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTrain, setSelectedTrain] =
    useState<VandeBharatRouteSummary | null>(null);

  // Live route stops drawer state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [activeModalTrain, setActiveModalTrain] =
    useState<VandeBharatRouteSummary | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Live fare drawer state
  const [liveFares, setLiveFares] = useState<Record<string, TrainFareEntry[]>>(
    {},
  );
  const [isLoadingFare, setIsLoadingFare] = useState<Record<string, boolean>>(
    {},
  );

  // Time arbitrage calculator state
  const [hourlyValuation, setHourlyValuation] = useState<number>(500);
  const [arbitrageRoute, setArbitrageRoute] = useState<VandeBharatRouteSummary>(
    VANDE_BHARAT_CATALOGUE[0],
  );

  // Catering opt-out state
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [optOutBreakfast, setOptOutBreakfast] = useState<boolean>(true);
  const [optOutLunchDinner, setOptOutLunchDinner] = useState<boolean>(true);
  const [optOutSnacks, setOptOutSnacks] = useState<boolean>(false);

  // Filter catalogue
  const filteredTrains = useMemo(() => {
    return VANDE_BHARAT_CATALOGUE.filter((train) => {
      const matchesRegion =
        selectedRegion === "ALL" || train.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        train.trainNo.includes(q) ||
        train.returnTrainNo.includes(q) ||
        train.name.toLowerCase().includes(q) ||
        train.fromCity.toLowerCase().includes(q) ||
        train.toCity.toLowerCase().includes(q) ||
        train.fromCode.toLowerCase().includes(q) ||
        train.toCode.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  // Fetch live route from erail network endpoint
  const handleOpenRouteModal = async (train: VandeBharatRouteSummary) => {
    setActiveModalTrain(train);
    setIsRouteModalOpen(true);
    setIsLoadingRoute(true);
    setRouteError(null);
    setRouteStops(null);

    try {
      const res = await fetch(`/api/erail/getRoute?trainNo=${train.trainNo}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setRouteStops(data.data);
      } else {
        setRouteError(
          "Unable to retrieve live halt timings from erail network.",
        );
      }
    } catch {
      setRouteError("Network timeout connecting to erail servers.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Fetch live fare from erail network endpoint
  const handleFetchLiveFare = async (train: VandeBharatRouteSummary) => {
    const key = `${train.trainNo}_${train.fromCode}_${train.toCode}`;
    if (liveFares[key]) return; // already loaded

    setIsLoadingFare((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(
        `/api/erail/fare?trainNo=${train.trainNo}&from=${train.fromCode}&to=${train.toCode}`,
      );
      const data = await res.json();
      if (data && data.success && Array.isArray(data.fares)) {
        setLiveFares((prev) => ({ ...prev, [key]: data.fares }));
      }
    } catch (err) {
      console.error("Failed to fetch live erail fare:", err);
    } finally {
      setIsLoadingFare((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Catering total savings calculation
  const cateringSavingsPerPerson =
    (optOutBreakfast ? 140 : 0) +
    (optOutLunchDinner ? 260 : 0) +
    (optOutSnacks ? 105 : 0);
  const totalCateringSavings = cateringSavingsPerPerson * passengerCount;

  // Time arbitrage calculations
  // Parse durations e.g. "8h 00m" -> 8.0, "12h 45m" -> 12.75
  const parseHours = (durationStr: string) => {
    const m = durationStr.match(/(\d+)h(?:\s*(\d+)m)?/);
    if (!m) return 8;
    const hours = parseInt(m[1], 10);
    const mins = m[2] ? parseInt(m[2], 10) : 0;
    return hours + mins / 60;
  };

  const vbHours = parseHours(arbitrageRoute.typicalDuration);
  const regHours = parseHours(arbitrageRoute.regularExpressDuration);
  const flightDoorToDoorHours = 5.0; // flight 2h + 2.5h airport wait/security + 0.5h baggage/cab

  // Costs
  const vbTicket = arbitrageRoute.fareCCEstimate;
  const regTicket = Math.round(arbitrageRoute.fareCCEstimate * 0.58); // typical 3A/2S fare
  const flightTicket = Math.max(
    3800,
    Math.round(arbitrageRoute.distanceKm * 5.8),
  );

  // Economic Time Cost = Ticket + (Hours * Hourly Valuation)
  const vbEconomicCost = Math.round(vbTicket + vbHours * hourlyValuation);
  const regEconomicCost = Math.round(regTicket + regHours * hourlyValuation);
  const flightEconomicCost = Math.round(
    flightTicket + flightDoorToDoorHours * hourlyValuation,
  );

  const bestChoice =
    vbEconomicCost <= regEconomicCost && vbEconomicCost <= flightEconomicCost
      ? "VANDE_BHARAT"
      : flightEconomicCost < vbEconomicCost &&
          flightEconomicCost < regEconomicCost
        ? "FLIGHT"
        : "REGULAR_TRAIN";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-950 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            Direct erail.in Network Integration
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Pan-India{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Vande Bharat
            </span>{" "}
            & Sleeper Explorer
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            Experience India&apos;s next-generation semi-high-speed network.
            Compare live schedules, real-time halts via erail APIs, dynamic
            fares, IRCTC meal opt-out savings, and the 2026 Vande Bharat Sleeper
            blueprint.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-medium mb-1">
                <Gauge className="w-4 h-4" /> Top Speed
              </div>
              <div className="text-2xl font-bold text-white">160 km/h</div>
              <div className="text-[11px] text-slate-300">
                Fastest Indian EMU Train
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-medium mb-1">
                <Clock className="w-4 h-4" /> Time Saved
              </div>
              <div className="text-2xl font-bold text-white">2h - 5h</div>
              <div className="text-[11px] text-slate-300">
                vs Conventional Superfasts
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-medium mb-1">
                <Coins className="w-4 h-4" /> Meal Opt-Out
              </div>
              <div className="text-2xl font-bold text-white">Save ₹390</div>
              <div className="text-[11px] text-slate-300">
                Per passenger at checkout
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-medium mb-1">
                <Bed className="w-4 h-4" /> Sleeper Blueprint
              </div>
              <div className="text-2xl font-bold text-white">16 Coached</div>
              <div className="text-[11px] text-slate-300">
                Jerk-free tightlock couplers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-12">
        {/* Search & Region Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search train no (22436), city (Varanasi, Delhi), or code (NDLS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Region Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                ["ALL", "NORTH", "WEST", "SOUTH", "EAST", "CENTRAL"] as const
              ).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedRegion === reg
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {reg === "ALL"
                    ? "All Corridors"
                    : `${reg.charAt(0) + reg.slice(1).toLowerCase()}`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>
              Showing <strong>{filteredTrains.length}</strong> premier Vande
              Bharat routes
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Live Erail Schedule &
              Fares Enabled
            </span>
          </div>
        </div>

        {/* Route Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrains.map((train) => {
            const fareKey = `${train.trainNo}_${train.fromCode}_${train.toCode}`;
            const trainLiveFare = liveFares[fareKey];
            const isFareLoading = isLoadingFare[fareKey];

            return (
              <div
                key={train.trainNo}
                className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold tracking-wider">
                      #{train.trainNo} / #{train.returnTrainNo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      {train.region}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-purple-600 transition">
                    {train.name}
                  </h3>

                  <div className="mt-1 text-xs font-medium text-purple-600">
                    {train.highlightTag}
                  </div>

                  {/* Route & Times */}
                  <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {train.fromCode}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[85px]">
                        {train.fromCity}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">
                        {train.depTime}
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {train.typicalDuration}
                      </div>
                      <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-500 relative flex items-center justify-center">
                        <Train className="w-3 h-3 text-purple-600 -mt-0.5" />
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        Saves {train.hoursSaved}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {train.toCode}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[85px]">
                        {train.toCity}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">
                        {train.arrTime}
                      </div>
                    </div>
                  </div>

                  {/* Run Days & Speed */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {train.runsOnDays}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Gauge className="w-3.5 h-3.5 text-purple-500" />
                      Avg {train.avgSpeedKmph} km/h (Top {train.topSpeedKmph})
                    </span>
                  </div>

                  {/* Live Fare Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {trainLiveFare ? (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{" "}
                            Live Erail Fare Table
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            1 Adult
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          {trainLiveFare.map((fare) => (
                            <div
                              key={fare.travelClass}
                              className="bg-white/80 rounded-lg py-1 px-2 border border-emerald-100"
                            >
                              <span className="text-[10px] text-slate-500 font-medium">
                                {fare.travelClass} (Gen / Tatkal)
                              </span>
                              <div className="text-xs font-bold text-slate-900">
                                ₹{fare.general ?? "--"}{" "}
                                {fare.tatkal ? `/ ₹${fare.tatkal}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Benchmarked Fare
                          </span>
                          <div className="text-xs font-bold text-slate-900">
                            CC: ₹{train.fareCCEstimate} · EC: ₹
                            {train.fareECEstimate}
                          </div>
                        </div>
                        <button
                          onClick={() => handleFetchLiveFare(train)}
                          disabled={isFareLoading}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                        >
                          {isFareLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                          ) : (
                            <RefreshCw className="w-3 h-3 text-slate-500" />
                          )}
                          {isFareLoading ? "Checking..." : "Live Fare"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRouteModal(train)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-purple-600/20"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Stops & Timetable
                  </button>
                  <button
                    onClick={() => {
                      setArbitrageRoute(train);
                      const el = document.getElementById(
                        "arbitrage-calculator",
                      );
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    title="Compare vs Flight & Express in Arbitrage Calculator"
                    className="py-2 px-3 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-xs transition flex items-center justify-center gap-1"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Arbitrage
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FEATURE 2: Time Saved Arbitrage Calculator ("Is Vande Bharat Worth It?") */}
        <section
          id="arbitrage-calculator"
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200 p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                Time Saved vs Cost Arbitrage Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Is Vande Bharat Truly Cheaper Than Flights?
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Most travelers only compare ticket prices. This engine computes
                your <strong>True Economic Cost</strong> factoring in
                door-to-door transit, airport security waiting overhead, and
                your hourly income value.
              </p>
            </div>

            {/* Train selector */}
            <div className="w-full lg:w-auto">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Active Corridor
              </label>
              <select
                value={arbitrageRoute.trainNo}
                onChange={(e) => {
                  const found = VANDE_BHARAT_CATALOGUE.find(
                    (t) => t.trainNo === e.target.value,
                  );
                  if (found) setArbitrageRoute(found);
                }}
                className="w-full lg:w-72 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {VANDE_BHARAT_CATALOGUE.map((t) => (
                  <option key={t.trainNo} value={t.trainNo}>
                    {t.name} ({t.fromCode} → {t.toCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Hourly Valuation Slider */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Hourly Time Valuation
                </span>
                <p className="text-xs text-slate-500">
                  How much 1 hour of your productive time or peace of mind is
                  worth to you
                </p>
              </div>
              <div className="text-lg font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                ₹{hourlyValuation} / hour
              </div>
            </div>

            <input
              type="range"
              min="150"
              max="2500"
              step="50"
              value={hourlyValuation}
              onChange={(e) => setHourlyValuation(Number(e.target.value))}
              className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1">
              <span>₹150/hr (Student / Saver)</span>
              <span>₹500/hr (Working Professional)</span>
              <span>₹1,500/hr (Senior / Consultant)</span>
              <span>₹2,500/hr (Executive)</span>
            </div>
          </div>

          {/* Comparative 3-Way Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Conventional Train */}
            <div
              className={`rounded-2xl p-5 border transition-all ${
                bestChoice === "REGULAR_TRAIN"
                  ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase">
                  Regular Superfast
                </span>
                {bestChoice === "REGULAR_TRAIN" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Best Value
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{regEconomicCost}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Economic Cost
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket Fare:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{regTicket}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Journey Duration:</span>
                  <span className="font-semibold text-slate-800">
                    {arbitrageRoute.regularExpressDuration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Time Cost ({regHours.toFixed(1)}h):
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{Math.round(regHours * hourlyValuation)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Vande Bharat */}
            <div
              className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${
                bestChoice === "VANDE_BHARAT"
                  ? "bg-purple-50/60 border-purple-400 ring-2 ring-purple-600/30 shadow-lg"
                  : "bg-white border-slate-200"
              }`}
            >
              {bestChoice === "VANDE_BHARAT" && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Top Recommended
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1">
                  <Train className="w-3.5 h-3.5" /> Vande Bharat
                </span>
              </div>
              <div className="text-2xl font-black text-purple-900">
                ₹{vbEconomicCost}
              </div>
              <div className="text-xs text-purple-600/80 mb-4">
                Total Economic Cost
              </div>

              <div className="space-y-2 text-xs border-t border-purple-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket Fare (CC):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{vbTicket}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Journey Duration:</span>
                  <span className="font-semibold text-emerald-600 font-bold">
                    {arbitrageRoute.typicalDuration} (-
                    {arbitrageRoute.hoursSaved})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Time Cost ({vbHours.toFixed(1)}h):
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{Math.round(vbHours * hourlyValuation)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Flight */}
            <div
              className={`rounded-2xl p-5 border transition-all ${
                bestChoice === "FLIGHT"
                  ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase">
                  Domestic Flight
                </span>
                {bestChoice === "FLIGHT" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Fastest
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{flightEconomicCost}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Total Economic Cost
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Airfare + Cabs:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{flightTicket}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Door-to-Door Time:</span>
                  <span className="font-semibold text-slate-800">
                    5h 00m (inc. airport check-in)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Cost (5.0h):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Math.round(flightDoorToDoorHours * hourlyValuation)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong>Arbitrage Insight:</strong> For routes under 600 km (like{" "}
              {arbitrageRoute.fromCity} to {arbitrageRoute.toCity}), Vande
              Bharat beats flights because airport transit, security queues, and
              bag drop easily consume 4 to 5 hours. You arrive relaxed right in
              the city center with zero luggage weight restrictions and working
              laptop sockets.
            </div>
          </div>
        </section>

        {/* FEATURE 3: IRCTC Catering Opt-Out Calculator */}
        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                IRCTC Official Rules Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Vande Bharat Catering Menu & Opt-Out Savings
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Did you know? Railway board rules permit passengers to opt out
                of onboard meals while booking on IRCTC, instantly slashing the
                ticket cost by up to ₹390 per passenger.
              </p>
            </div>

            {/* Savings Badge */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg shadow-emerald-500/20 text-center sm:text-right shrink-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                Your Instant Cash Savings
              </div>
              <div className="text-3xl font-black">₹{totalCateringSavings}</div>
              <div className="text-[11px] text-emerald-100">
                For {passengerCount} passenger{passengerCount > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Passengers
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPassengerCount(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      passengerCount === num
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Morning Breakfast
                </span>
                <span className="text-xs font-extrabold text-emerald-600">
                  Save ₹140
                </span>
              </div>
              <button
                onClick={() => setOptOutBreakfast(!optOutBreakfast)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  optOutBreakfast
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {optOutBreakfast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : null}
                {optOutBreakfast ? "Opt-Out (Bring Own)" : "Include IRCTC Meal"}
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Lunch / Dinner
                </span>
                <span className="text-xs font-extrabold text-emerald-600">
                  Save ₹260
                </span>
              </div>
              <button
                onClick={() => setOptOutLunchDinner(!optOutLunchDinner)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  optOutLunchDinner
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {optOutLunchDinner ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : null}
                {optOutLunchDinner
                  ? "Opt-Out (Bring Own)"
                  : "Include IRCTC Meal"}
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Evening High Tea
                </span>
                <span className="text-xs font-extrabold text-emerald-600">
                  Save ₹105
                </span>
              </div>
              <button
                onClick={() => setOptOutSnacks(!optOutSnacks)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  optOutSnacks
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {optOutSnacks ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                {optOutSnacks ? "Opt-Out (Bring Own)" : "Include IRCTC Meal"}
              </button>
            </div>
          </div>

          {/* Detailed Menu Accordion/Grid */}
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-purple-600" /> Standard Vande Bharat
            Onboard Menu Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATERING_MENU.map((menu) => (
              <div
                key={menu.mealName}
                className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                    {menu.timeWindow}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-3">
                    {menu.mealName}
                  </h4>

                  {/* Veg Items */}
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />{" "}
                      Vegetarian Platter
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {menu.vegItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Non Veg Items */}
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />{" "}
                      Non-Vegetarian Option
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {menu.nonVegItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg p-2">
                  {menu.optOutSavings}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE 4: 2026 Vande Bharat Sleeper vs Traditional Rajdhani Specs */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Bed className="w-3.5 h-3.5" /> Next-Gen Overnight Rail Travel
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Vande Bharat Sleeper vs Traditional Rajdhani
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Indian Railways is inaugurating the 16-coach Vande Bharat Sleeper
              trains on trunk routes like Delhi-Mumbai and Delhi-Howrah. Here is
              how the rider experience transforms:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Feature / Technology</th>
                  <th className="py-3 px-4 text-purple-300">
                    New Vande Bharat Sleeper
                  </th>
                  <th className="py-3 px-4 text-slate-400">
                    Traditional Rajdhani Express
                  </th>
                  <th className="py-3 px-4 text-emerald-400">
                    Traveler Advantage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {SLEEPER_COMPARISON_SPECS.map((spec) => (
                  <tr
                    key={spec.feature}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {spec.feature}
                    </td>
                    <td className="py-3.5 px-4 text-purple-200 font-semibold">
                      {spec.vandeBharatSleeper}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {spec.traditionalRajdhani}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-300 font-medium">
                      {spec.travelerBenefit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL: ERAIL LIVE ROUTE & HALT TIMINGS */}
      {isRouteModalOpen && activeModalTrain && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold mb-1">
                  <Train className="w-3 h-3" /> Live Erail Route Engine
                </div>
                <h3 className="text-lg font-bold">
                  {activeModalTrain.name} (#{activeModalTrain.trainNo})
                </h3>
                <p className="text-xs text-purple-200">
                  {activeModalTrain.fromCity} ({activeModalTrain.fromCode}) →{" "}
                  {activeModalTrain.toCity} ({activeModalTrain.toCode}) ·{" "}
                  {activeModalTrain.distanceKm} km
                </p>
              </div>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {isLoadingRoute ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-semibold">
                    Fetching live halt timings from erail.in...
                  </p>
                </div>
              ) : routeError ? (
                <div className="py-8 text-center text-slate-600">
                  <p className="text-sm font-semibold text-rose-600 mb-2">
                    {routeError}
                  </p>
                  <p className="text-xs text-slate-400">
                    Typical stops for this service: {activeModalTrain.fromCode},
                    intermediate major junctions, and {activeModalTrain.toCode}.
                  </p>
                </div>
              ) : routeStops && routeStops.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                  {routeStops.map((stop, idx) => {
                    const isOrigin = idx === 0;
                    const isDest = idx === routeStops.length - 1;
                    return (
                      <div
                        key={stop.source_stn_code + idx}
                        className="relative flex items-start justify-between text-xs"
                      >
                        <div
                          className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isOrigin || isDest
                              ? "bg-purple-600 ring-2 ring-purple-300"
                              : "bg-indigo-400"
                          }`}
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {stop.source_stn_name}{" "}
                            <span className="text-purple-600 font-semibold text-xs">
                              ({stop.source_stn_code})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Day {stop.day} · {stop.distance} km from origin
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-slate-800">
                            Arr:{" "}
                            <span className="font-mono">{stop.arrive}</span> |
                            Dep:{" "}
                            <span className="font-mono">{stop.depart}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No halt data available for this train.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Data source: erail.in train route network API
              </span>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
