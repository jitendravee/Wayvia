"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import RelatedBlogGuides from "../components/RelatedBlogGuides";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  Search,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  DoorOpen,
  Eye,
  AlertCircle,
  ExternalLink,
  Flame,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  CoachClassType,
  CoachInRake,
  SeatInfo,
  BERTH_CONFIG,
  getCoachLayout,
  buildTrainRakeProfile,
  POPULAR_TRAIN_RAKES,
} from "@/lib/coach/coachLayoutEngine";
import { POPULAR_TRAINS, TrainSummary } from "@/lib/trains";

const PRESET_TRAINS = [
  { no: "12951", name: "Mumbai Rajdhani", from: "MMCT", to: "NDLS" },
  { no: "12301", name: "Howrah Rajdhani", from: "HWH", to: "NDLS" },
  { no: "12009", name: "Shatabdi Express", from: "MAS", to: "SBC" },
  { no: "12925", name: "Paschim Express", from: "BDTS", to: "ASR" },
  { no: "12626", name: "Kerala Express", from: "NDLS", to: "TVC" },
  { no: "22436", name: "Vande Bharat Exp", from: "NDLS", to: "BSB" },
];

export default function CoachPositionClient() {
  const [selectedTrainNo, setSelectedTrainNo] = useState("12951");
  const [trainSearchQuery, setTrainSearchQuery] = useState("");
  const [trainSuggestions, setTrainSuggestions] = useState<TrainSummary[]>([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);

  // Train Rake data
  const [trainProfile, setTrainProfile] = useState(() =>
    buildTrainRakeProfile("12951", "MUMBAI RAJDHANI", "MMCT", "NDLS"),
  );

  // Selected coach index (1-indexed)
  const [selectedCoachIndex, setSelectedCoachIndex] = useState<number>(3); // e.g. B2 or B3

  // Seat search / spotlight
  const [searchedSeat, setSearchedSeat] = useState<string>("");
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<SeatInfo | null>(
    null,
  );

  // Sync train profile when selected train changes
  useEffect(() => {
    const popular = POPULAR_TRAINS.find((t) => t.trainNo === selectedTrainNo);
    const name = popular ? popular.trainName : `Train ${selectedTrainNo}`;
    const from = popular ? popular.from : "Origin";
    const to = popular ? popular.to : "Destination";

    const profile = buildTrainRakeProfile(selectedTrainNo, name, from, to);
    setTrainProfile(profile);

    // Pick first passenger coach (skip LOCO and EOG)
    const firstPassengerCoachIdx = profile.coaches.findIndex(
      (c) => c.classType !== "ENG" && c.classType !== "SLR",
    );
    setSelectedCoachIndex(
      firstPassengerCoachIdx >= 0 ? firstPassengerCoachIdx + 1 : 1,
    );
    setSelectedSeatInfo(null);
  }, [selectedTrainNo]);

  // Current active coach
  const currentCoach = useMemo(() => {
    return (
      trainProfile.coaches.find(
        (c) => c.positionIndex === selectedCoachIndex,
      ) || trainProfile.coaches[0]
    );
  }, [trainProfile, selectedCoachIndex]);

  // Coach Layout definition
  const coachLayout = useMemo(() => {
    return getCoachLayout(currentCoach.classType);
  }, [currentCoach]);

  // Selected seat highlights
  const highlightedSeatNo = useMemo(() => {
    const parsed = parseInt(searchedSeat.trim(), 10);
    return !isNaN(parsed) && parsed > 0 && parsed <= coachLayout.totalSeats
      ? parsed
      : null;
  }, [searchedSeat, coachLayout]);

  // Handle train search
  const handleTrainSearchChange = async (val: string) => {
    setTrainSearchQuery(val);
    if (!val.trim()) {
      setTrainSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/trains/search?q=${encodeURIComponent(val)}&limit=5`,
      );
      const json = await res.json();
      if (json.results) {
        setTrainSuggestions(json.results);
      }
    } catch {
      // fallback
    }
  };

  // Select train from search
  const selectTrain = (t: TrainSummary) => {
    setSelectedTrainNo(t.trainNo);
    setTrainSearchQuery("");
    setShowSearchDrop(false);
  };

  // Find seat info if highlighted
  useEffect(() => {
    if (highlightedSeatNo) {
      const found = coachLayout.seats.find(
        (s) => s.seatNo === highlightedSeatNo,
      );
      setSelectedSeatInfo(found || null);
    }
  }, [highlightedSeatNo, coachLayout]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
          <Train size={13} />
          Interactive Coach Position &amp; Seat Explorer
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Train Coach Position &amp; 2D Seat Map
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          See exactly where your coach will stop on the platform (near
          escalator, engine side, or rear) and explore the full 2D seat map with
          window, middle, and aisle views.
        </p>
      </header>

      {/* SEARCH BAR & PRESETS */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Search Train Number or Name
            </label>
            <div className="relative mt-1">
              <Search
                size={16}
                className="absolute left-3.5 top-3 text-ink-dim"
              />
              <input
                type="text"
                value={trainSearchQuery}
                onChange={(e) => {
                  handleTrainSearchChange(e.target.value);
                  setShowSearchDrop(true);
                }}
                onFocus={() => setShowSearchDrop(true)}
                placeholder="e.g. 12951 or Mumbai Rajdhani..."
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3.5 font-mono text-sm text-ink outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet"
              />
            </div>

            {/* AUTOCOMPLETE DROPDOWN */}
            {showSearchDrop && trainSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg">
                {trainSuggestions.map((t) => (
                  <li
                    key={t.trainNo}
                    onClick={() => selectTrain(t)}
                    className="cursor-pointer px-4 py-2.5 text-xs hover:bg-violet-soft"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-ink">
                        {t.trainNo}
                      </span>
                      <span className="font-mono text-[11px] text-ink-dim">
                        {t.from} → {t.to}
                      </span>
                    </div>
                    <div className="text-ink-muted font-medium">
                      {t.trainName}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ACTIVE TRAIN BADGE */}
          <div className="flex shrink-0 flex-col items-start rounded-xl border border-border bg-surface-alt p-3 md:items-end">
            <div className="flex items-center gap-2">
              <span className="rounded bg-violet px-2 py-0.5 font-mono text-xs font-bold text-white">
                {trainProfile.trainNo}
              </span>
              <span className="font-display text-sm font-bold text-ink">
                {trainProfile.trainName}
              </span>
            </div>
            <div className="mt-1 font-mono text-xs text-ink-muted">
              {trainProfile.from} → {trainProfile.to} •{" "}
              {trainProfile.totalCoaches} Coaches
            </div>
          </div>
        </div>

        {/* POPULAR PRESETS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
            Flagship Trains:
          </span>
          {PRESET_TRAINS.map((t) => (
            <button
              key={t.no}
              onClick={() => setSelectedTrainNo(t.no)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedTrainNo === t.no
                  ? "border-violet bg-violet-soft text-violet font-semibold"
                  : "border-border bg-white text-ink-muted hover:border-violet/40 hover:text-ink"
              }`}
            >
              {t.no} {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* PLATFORM ORIENTATION INDICATOR */}
      <div className="mt-8 flex items-center justify-between px-2 font-mono text-xs text-ink-muted">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <span>🚂 Front / Engine (LOCO)</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-[11px]">
          <MapPin size={12} className="text-violet" />
          <span>Platform Center (Escalator &amp; Foot-Over-Bridge)</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <span>Guard / Brake Van (SLR) 🛑</span>
        </div>
      </div>

      {/* HORIZONTAL 22-COACH RAKE STRIP */}
      <section className="relative mt-2 overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        {/* SCROLLABLE TRACK */}
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="flex min-w-max items-center gap-2 px-2">
            {/* LOCOMOTIVE ENGINE */}
            <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-slate-700 bg-slate-800 text-white shadow-sm">
              <span className="text-lg">🚂</span>
              <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                WAP-7 LOCO
              </span>
            </div>

            {/* CONNECTING LINK */}
            <div className="h-1 w-2 bg-slate-400" />

            {/* COACHES */}
            {trainProfile.coaches.map((coach) => {
              const isSelected = coach.positionIndex === selectedCoachIndex;
              const isEngineOrVan =
                coach.classType === "ENG" || coach.classType === "SLR";

              // Distinct color styles by class
              let colorClass =
                "border-border bg-white text-ink hover:border-violet/40";
              if (coach.classType === "3A")
                colorClass = "border-violet/40 bg-violet-soft/30 text-violet";
              else if (coach.classType === "2A")
                colorClass =
                  "border-emerald-300 bg-emerald-50 text-emerald-800";
              else if (coach.classType === "1A")
                colorClass = "border-purple-300 bg-purple-50 text-purple-800";
              else if (coach.classType === "3E")
                colorClass = "border-cyan-300 bg-cyan-50 text-cyan-800";
              else if (coach.classType === "SL")
                colorClass = "border-amber-300 bg-amber-50 text-amber-800";
              else if (coach.classType === "CC")
                colorClass = "border-blue-300 bg-blue-50 text-blue-800";
              else if (coach.classType === "EC")
                colorClass = "border-indigo-300 bg-indigo-50 text-indigo-800";
              else if (coach.classType === "PC")
                colorClass = "border-slate-300 bg-slate-100 text-slate-700";

              return (
                <React.Fragment key={coach.positionIndex}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (!isEngineOrVan) {
                        setSelectedCoachIndex(coach.positionIndex);
                      }
                    }}
                    disabled={isEngineOrVan}
                    className={`relative flex h-20 w-20 shrink-0 flex-col items-center justify-between rounded-xl border-2 p-2 transition-all ${
                      isSelected
                        ? "border-violet bg-violet text-white shadow-md ring-2 ring-violet ring-offset-2 scale-105"
                        : colorClass
                    }`}
                  >
                    {/* POSITION BADGE */}
                    <span
                      className={`font-mono text-[9px] ${isSelected ? "text-violet-soft" : "text-ink-dim"}`}
                    >
                      #{coach.positionIndex}
                    </span>

                    {/* COACH CODE */}
                    <span className="font-display text-base font-extrabold tracking-tight">
                      {coach.coachCode}
                    </span>

                    {/* CLASS TYPE */}
                    <span
                      className={`font-mono text-[9px] uppercase font-semibold ${isSelected ? "text-white" : ""}`}
                    >
                      {coach.classType}
                    </span>

                    {/* ESCALATOR ICON */}
                    {coach.nearEscalator && (
                      <span
                        title="Near Platform Escalator / FOB"
                        className="absolute -top-2 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[9px] text-white shadow-xs"
                      >
                        ⚡
                      </span>
                    )}
                  </motion.button>
                  <div className="h-1 w-1.5 bg-slate-300 shrink-0" />
                </React.Fragment>
              );
            })}
          </div>

          {/* TRACK LINE DECORATION */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200" />
        </div>

        {/* ACTIVE COACH PLATFORM POSITION CARD */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-violet/20 bg-violet-soft/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-violet px-2 py-0.5 font-mono text-xs font-bold text-white">
                Coach {currentCoach.coachCode}
              </span>
              <h3 className="font-display text-base font-bold text-ink">
                {coachLayout.className} (Position #{currentCoach.positionIndex}{" "}
                from Engine)
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {currentCoach.platformZoneLabel} •{" "}
              {currentCoach.nearEscalator
                ? "Excellent position: Stops right in front of the central Foot-Over-Bridge & Escalator."
                : currentCoach.platformZone === "FRONT"
                  ? "Stops near the front engine side of the platform. Walk forward towards engine."
                  : "Stops towards the guard / rear side of the platform."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-ink border border-border">
              {coachLayout.totalSeats} Total Berths
            </span>
          </div>
        </div>
      </section>

      {/* SEAT SEARCH & SPOTLIGHT CONTROLS */}
      <section className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Sparkles size={16} className="text-violet" />
              Find &amp; Spotlight Your Seat
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              Enter your allotted seat number (1–{coachLayout.totalSeats}) to
              spotlight it on the 2D layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min="1"
                max={coachLayout.totalSeats}
                value={searchedSeat}
                onChange={(e) => setSearchedSeat(e.target.value)}
                placeholder={`Seat (1-${coachLayout.totalSeats})`}
                className="w-36 rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-violet focus:ring-1 focus:ring-violet"
              />
            </div>

            {searchedSeat && (
              <button
                type="button"
                onClick={() => setSearchedSeat("")}
                className="rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-ink-muted hover:bg-surface-alt"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* VERDICT BANNER WHEN SEAT IS SEARCHED */}
        <AnimatePresence>
          {selectedSeatInfo && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-xs"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <span className="rounded bg-emerald-600 px-2 py-0.5 font-mono text-xs text-white">
                      Seat {selectedSeatInfo.seatNo}
                    </span>
                    <span className="font-display text-sm">
                      {selectedSeatInfo.berthLabel}
                    </span>
                    <span className="font-mono text-xs text-emerald-700">
                      (Bay #{selectedSeatInfo.bayNo})
                    </span>
                  </div>
                  <p className="mt-1 text-emerald-800">
                    {selectedSeatInfo.isWindow
                      ? "🪟 Window side berth with direct outside views and dedicated charging point."
                      : selectedSeatInfo.isAisle
                        ? "🚶 Aisle side berth for easy walkway access without disturbing co-passengers."
                        : "🛏️ Comfortable inside cabin berth."}
                    {selectedSeatInfo.isRestroomProximity
                      ? " ⚠️ Note: Located in the outer bay near the coach entrance/restroom."
                      : " ✅ Located comfortably away from the restrooms."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold ${
                      BERTH_CONFIG[selectedSeatInfo.berthCode].badge
                    }`}
                  >
                    {selectedSeatInfo.berthCode} • {selectedSeatInfo.berthLabel}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2D COACH BLUEPRINT SEAT MAP */}
      <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DoorOpen size={18} className="text-violet" />
              <h3 className="font-display text-xl font-bold text-ink">
                Coach {currentCoach.coachCode} 2D Blueprint Layout
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Interactive bay-by-bay architectural map. Click any berth to
              inspect features.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-signal-green" /> Window
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-violet" /> Upper
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-signal-amber" /> Middle
            </span>
          </div>
        </div>

        {/* 2D COACH CONTAINER */}
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="relative min-w-max rounded-2xl border-4 border-slate-700 bg-slate-50 p-4 shadow-inner">
            {/* LEFT VESTIBULE & TOILETS */}
            <div className="flex items-center gap-4">
              {/* DOOR & RESTROOM LEFT */}
              <div className="flex flex-col gap-2 border-r-2 border-dashed border-slate-300 pr-3 text-center">
                <div className="rounded-lg bg-slate-200 px-2 py-4 font-mono text-[10px] font-bold text-slate-600">
                  DOOR 🚪
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-3 font-mono text-[9px] font-bold text-rose-700">
                  🚻 WC 1
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-3 font-mono text-[9px] font-bold text-rose-700">
                  🚻 WC 2
                </div>
              </div>

              {/* BAYS CONTAINER */}
              <div className="flex gap-3">
                {Array.from({ length: coachLayout.baysCount }).map(
                  (_, bayIdx) => {
                    const bayNo = bayIdx + 1;
                    const baySeats = coachLayout.seats.filter(
                      (s) => s.bayNo === bayNo,
                    );

                    // Separate into Main Bay vs Side Berths (for sleeper / 3A / 2A / 3E)
                    const mainSeats = baySeats.filter(
                      (s) =>
                        s.berthCode !== "SL" &&
                        s.berthCode !== "SU" &&
                        s.berthCode !== "SM",
                    );
                    const sideSeats = baySeats.filter(
                      (s) =>
                        s.berthCode === "SL" ||
                        s.berthCode === "SU" ||
                        s.berthCode === "SM",
                    );

                    return (
                      <div
                        key={bayNo}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs"
                      >
                        {/* BAY HEADER */}
                        <div className="mb-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Bay {bayNo}
                        </div>

                        {/* MAIN COMPARTMENT (WINDOW + AISLE ROWS) */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {mainSeats.map((seat) => {
                            const isHighlighted =
                              seat.seatNo === highlightedSeatNo;
                            const isSelected =
                              selectedSeatInfo?.seatNo === seat.seatNo;
                            const conf = BERTH_CONFIG[seat.berthCode];

                            return (
                              <motion.button
                                key={seat.seatNo}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setSelectedSeatInfo(seat)}
                                className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg border font-mono text-[11px] font-bold transition-all ${
                                  isHighlighted
                                    ? "bg-violet text-white ring-4 ring-violet/40 scale-110 z-10 shadow-lg"
                                    : isSelected
                                      ? "ring-2 ring-violet border-violet bg-violet-soft text-violet"
                                      : conf.style
                                }`}
                              >
                                <span>{seat.seatNo}</span>
                                <span className="text-[8px] font-normal leading-none">
                                  {seat.berthCode}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* CENTRAL AISLE CORRIDOR */}
                        <div className="my-2.5 flex items-center justify-center border-y border-dashed border-slate-200 py-1 font-mono text-[8px] uppercase tracking-widest text-slate-300">
                          Aisle Corridor
                        </div>

                        {/* SIDE BERTHS (IF APPLICABLE) */}
                        {sideSeats.length > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {sideSeats.map((seat) => {
                              const isHighlighted =
                                seat.seatNo === highlightedSeatNo;
                              const isSelected =
                                selectedSeatInfo?.seatNo === seat.seatNo;
                              const conf = BERTH_CONFIG[seat.berthCode];

                              return (
                                <motion.button
                                  key={seat.seatNo}
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => setSelectedSeatInfo(seat)}
                                  className={`relative flex h-10 w-11 flex-col items-center justify-center rounded-lg border font-mono text-[11px] font-bold transition-all ${
                                    isHighlighted
                                      ? "bg-violet text-white ring-4 ring-violet/40 scale-110 z-10 shadow-lg"
                                      : isSelected
                                        ? "ring-2 ring-violet border-violet bg-violet-soft text-violet"
                                        : conf.style
                                  }`}
                                >
                                  <span>{seat.seatNo}</span>
                                  <span className="text-[8px] font-normal leading-none">
                                    {seat.berthCode}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}
                      </div>
                    );
                  },
                )}
              </div>

              {/* RIGHT VESTIBULE & TOILETS */}
              <div className="flex flex-col gap-2 border-l-2 border-dashed border-slate-300 pl-3 text-center">
                <div className="rounded-lg bg-slate-200 px-2 py-4 font-mono text-[10px] font-bold text-slate-600">
                  DOOR 🚪
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-3 font-mono text-[9px] font-bold text-rose-700">
                  🚻 WC 3
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-3 font-mono text-[9px] font-bold text-rose-700">
                  🚻 WC 4
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BERTH CODE LEGEND */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-border-soft pt-4">
          {(Object.keys(BERTH_CONFIG) as Array<keyof typeof BERTH_CONFIG>).map(
            (key) => {
              const item = BERTH_CONFIG[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-medium ${item.style}`}
                >
                  <span className="font-bold">{key}</span>
                  <span>= {item.label}</span>
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* PLATFORM DISPLAY BOARD & COACH SURVIVAL PLAYBOOK */}
      <section className="mt-12 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h3 className="font-display text-xl font-bold text-ink">
          How to Read Indian Railways Platform Coach Indicators
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          Avoid sprinting across 600-meter platforms with heavy luggage when
          your train pulls in.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              01 • Overhead Display Boards
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              Electronic Pillars
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Most major stations (New Delhi, Mumbai Central, Howrah) have small
              hanging electronic screens every 25 meters. They display the
              incoming train number and the specific coach (e.g.{" "}
              <code>12951 B4</code>) that will stop right under that pillar.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              02 • Platform Markings
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              Yellow Platform Numbers
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Painted on the yellow safety line of the platform are coach
              numbers (e.g. <code>S4</code>, <code>B2</code>). Wait near your
              marked box 15 minutes before train arrival to board comfortably.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="font-mono text-xs font-bold text-violet">
              03 • LHB vs ICF Standard
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              Modern Red LHB Rakes
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Modern red LHB coaches have 72/80 sleeper berths and 64/72 3A
              berths with centralized bio-toilets and power sockets at every
              bay. First AC (1A) always features lockable sliding coupe doors.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED COACH POSITION & SEAT GUIDES */}
      <RelatedBlogGuides
        title="Coach Position & Seat Map Guides"
        subtitle="Learn how Indian Railways configures train rakes, berth layouts, and platform indicators."
        guides={[
          {
            slug: "irctc-coach-position-seat-map-guide-2026",
            title: "IRCTC Coach Position & Seat Map Blueprint Guide (2026)",
            excerpt:
              "How Indian Railways orders 24 coaches, how platform escalator zones work, and 3E side middle layout rules.",
            category: "Rail",
            readTime: "9 min read",
          },
          {
            slug: "pnr-status-explained-cnf-rac-wl-meaning",
            title:
              "PNR Status Codes Explained (2026): CNF, RAC, WL & Coach Meaning",
            excerpt:
              "What your PNR allotment details mean, where to find your coach letter, and berth confirmation rules.",
            category: "Tips",
            readTime: "8 min read",
          },
          {
            slug: "vande-bharat-express-routes-guide",
            title:
              "Vande Bharat Express: Full Route List & What Makes It Different",
            excerpt:
              "Aerodynamic trainsets, Executive vs Chair Car seating layout, and 160 km/h coach technology.",
            category: "Rail",
            readTime: "7 min read",
          },
        ]}
      />
    </main>
  );
}
