"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import RelatedBlogGuides from "../components/RelatedBlogGuides";
import {
  Clock,
  Calendar as CalendarIcon,
  ArrowLeftRight,
  Copy,
  Check,
  Zap,
  Flame,
  AlertCircle,
  ShieldAlert,
  ExternalLink,
  UserPlus,
  Trash2,
  Train,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
} from "lucide-react";
import {
  getTatkalOpeningSchedule,
  calculateCountdown,
  analyzeTrainTatkal,
  generateGoogleCalendarUrl,
  generateIcsContent,
  formatPassengerMasterList,
  generateAutofillScript,
  PassengerDetail,
  TrainTatkalProfile,
  CountdownResult,
} from "@/lib/tatkal/tatkalEngine";
import { POPULAR_TRAINS } from "@/lib/trains";
import type { BetweenStationEntry } from "@/lib/erail/prettify";

interface StationOption {
  code: string;
  name: string;
  city?: string;
}

const POPULAR_CORRIDORS = [
  { label: "Delhi ↔ Mumbai", from: "NDLS", to: "MMCT" },
  { label: "Delhi ↔ Patna", from: "NDLS", to: "PNBE" },
  { label: "Bengaluru ↔ Chennai", from: "SBC", to: "MAS" },
  { label: "Mumbai ↔ Goa", from: "CSMT", to: "MAO" },
  { label: "Delhi ↔ Kolkata", from: "NDLS", to: "HWH" },
  { label: "Hyderabad ↔ Delhi", from: "SC", to: "NZM" },
];

const INITIAL_PASSENGERS: PassengerDetail[] = [
  {
    id: "p-1",
    name: "",
    age: "",
    gender: "M",
    berthPreference: "LB",
    foodPreference: "V",
  },
];

export default function TatkalClient() {
  // Format tomorrow as default journey date (since Tatkal books 1 day prior)
  const defaultJourneyDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [fromCode, setFromCode] = useState("NDLS");
  const [toCode, setToCode] = useState("MMCT");
  const [journeyDate, setJourneyDate] = useState(defaultJourneyDate);
  const [selectedClassTab, setSelectedClassTab] = useState<"ac" | "nonAc">(
    "ac",
  );

  // Station suggestions
  const [fromSuggestions, setFromSuggestions] = useState<StationOption[]>([]);
  const [toSuggestions, setToSuggestions] = useState<StationOption[]>([]);
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);

  // Train data
  const [trains, setTrains] = useState<TrainTatkalProfile[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState<CountdownResult>({
    status: "UPCOMING",
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    message: "Calculating opening schedule...",
  });

  // Master List state
  const [passengers, setPassengers] =
    useState<PassengerDetail[]>(INITIAL_PASSENGERS);
  const [upiVpa, setUpiVpa] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showMasterList, setShowMasterList] = useState(true);

  // Schedule derived from journey date
  const schedule = useMemo(() => {
    return getTatkalOpeningSchedule(journeyDate);
  }, [journeyDate]);

  // Update countdown every 1 second
  useEffect(() => {
    const targetMs =
      selectedClassTab === "ac"
        ? schedule.acOpeningMs
        : schedule.nonAcOpeningMs;

    const update = () => {
      setCountdown(calculateCountdown(targetMs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [schedule, selectedClassTab]);

  // Fetch trains between selected stations
  useEffect(() => {
    let active = true;
    async function loadTrains() {
      if (!fromCode || !toCode) return;
      setLoadingTrains(true);

      try {
        const res = await fetch(
          `/api/erail/betweenStations?from=${encodeURIComponent(
            fromCode,
          )}&to=${encodeURIComponent(toCode)}`,
        );
        const data = await res.json();

        if (active && data?.success && Array.isArray(data.data)) {
          const entries = data.data as BetweenStationEntry[];
          const analyzed = entries.map((e) =>
            analyzeTrainTatkal({
              trainNo: e.train_base.train_no,
              trainName: e.train_base.train_name,
              from: e.train_base.from_stn_code,
              to: e.train_base.to_stn_code,
              from_time: e.train_base.from_time,
              to_time: e.train_base.to_time,
              travel_time: e.train_base.travel_time,
            }),
          );
          setTrains(analyzed);
          setLoadingTrains(false);
          return;
        }
      } catch (err) {
        console.warn(
          "Could not load live train feed, falling back to curated list",
          err,
        );
      }

      // Fallback matching curated list
      if (active) {
        const filtered = POPULAR_TRAINS.filter(
          (t) =>
            (t.from === fromCode && t.to === toCode) ||
            t.from === fromCode ||
            t.to === toCode,
        );
        const source =
          filtered.length > 0 ? filtered : POPULAR_TRAINS.slice(0, 4);
        setTrains(source.map((t) => analyzeTrainTatkal(t)));
        setLoadingTrains(false);
      }
    }

    loadTrains();
    return () => {
      active = false;
    };
  }, [fromCode, toCode]);

  // Autocomplete stations search
  async function searchStation(query: string, type: "from" | "to") {
    if (!query.trim()) {
      if (type === "from") setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/stations?q=${encodeURIComponent(query)}&limit=6`,
      );
      const json = await res.json();
      if (json.results) {
        if (type === "from") setFromSuggestions(json.results);
        else setToSuggestions(json.results);
      }
    } catch {
      // ignore autocomplete errors
    }
  }

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Add passenger (max 4 per Tatkal ticket)
  const addPassenger = () => {
    if (passengers.length >= 4) return;
    setPassengers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        name: "",
        age: "",
        gender: "M",
        berthPreference: "NP",
        foodPreference: "V",
      },
    ]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePassenger = (
    id: string,
    field: keyof PassengerDetail,
    val: string,
  ) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)),
    );
  };

  // Formatted master list
  const masterStrings = useMemo(() => {
    return formatPassengerMasterList(passengers, upiVpa);
  }, [passengers, upiVpa]);

  // Executable 1-click script and bookmarklet for IRCTC auto-population
  const autofillScripts = useMemo(() => {
    return generateAutofillScript(passengers, upiVpa);
  }, [passengers, upiVpa]);

  // Calendar Links
  const googleCalUrl = useMemo(() => {
    const targetOpeningIso =
      selectedClassTab === "ac"
        ? schedule.acOpeningIso
        : schedule.nonAcOpeningIso;
    return generateGoogleCalendarUrl({
      from: fromCode,
      to: toCode,
      targetOpeningIso,
      type: selectedClassTab === "ac" ? "AC (10:00 AM)" : "Sleeper (11:00 AM)",
    });
  }, [fromCode, toCode, schedule, selectedClassTab]);

  const handleDownloadIcs = () => {
    const targetOpeningIso =
      selectedClassTab === "ac"
        ? schedule.acOpeningIso
        : schedule.nonAcOpeningIso;
    const content = generateIcsContent({
      from: fromCode,
      to: toCode,
      targetOpeningIso,
      type: selectedClassTab === "ac" ? "AC (10:00 AM)" : "Sleeper (11:00 AM)",
    });
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tatkal-alert-${fromCode}-${toCode}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Swap stations
  const swapStations = () => {
    const tmp = fromCode;
    setFromCode(toCode);
    setToCode(tmp);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
          <Zap size={13} className="text-violet" />
          Tatkal War Room
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Tatkal Command Center & Failover Matrix
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          Beat the 10:00 AM & 11:00 AM booking rush. Analyze real quota sizes,
          competition levels, pre-fill passenger master strings, and lock in
          failover routes before tickets vanish.
        </p>
      </header>

      {/* POPULAR CORRIDORS CHIPS */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
          Corridors:
        </span>
        {POPULAR_CORRIDORS.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              setFromCode(c.from);
              setToCode(c.to);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              fromCode === c.from && toCode === c.to
                ? "border-violet bg-violet-soft text-violet"
                : "border-border bg-white text-ink-muted hover:border-violet/40 hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* CONTROLS BAR */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* FROM STATION */}
          <div className="relative">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              From Station
            </label>
            <input
              type="text"
              value={fromCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setFromCode(val);
                searchStation(val, "from");
                setShowFromDrop(true);
              }}
              onFocus={() => setShowFromDrop(true)}
              placeholder="e.g. NDLS or Delhi"
              className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 font-mono text-sm font-semibold text-ink outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet"
            />
            {showFromDrop && fromSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg">
                {fromSuggestions.map((s) => (
                  <li
                    key={s.code}
                    onClick={() => {
                      setFromCode(s.code);
                      setShowFromDrop(false);
                    }}
                    className="cursor-pointer px-3 py-2 text-xs hover:bg-violet-soft"
                  >
                    <span className="font-mono font-bold text-ink">
                      {s.code}
                    </span>
                    <span className="ml-2 text-ink-muted">{s.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SWAP BUTTON (DESKTOP INLINE, MOBILE COMPACT) */}
          <div className="flex items-end">
            <div className="relative w-full">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                To Station
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={toCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setToCode(val);
                    searchStation(val, "to");
                    setShowToDrop(true);
                  }}
                  onFocus={() => setShowToDrop(true)}
                  placeholder="e.g. MMCT or Mumbai"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 font-mono text-sm font-semibold text-ink outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet"
                />
                <button
                  onClick={swapStations}
                  title="Swap Origin and Destination"
                  className="absolute right-2 top-2 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-surface-alt hover:text-violet"
                >
                  <ArrowLeftRight size={14} />
                </button>
              </div>

              {showToDrop && toSuggestions.length > 0 && (
                <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg">
                  {toSuggestions.map((s) => (
                    <li
                      key={s.code}
                      onClick={() => {
                        setToCode(s.code);
                        setShowToDrop(false);
                      }}
                      className="cursor-pointer px-3 py-2 text-xs hover:bg-violet-soft"
                    >
                      <span className="font-mono font-bold text-ink">
                        {s.code}
                      </span>
                      <span className="ml-2 text-ink-muted">{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* JOURNEY DATE */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Journey Date
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet"
            />
          </div>

          {/* TATKAL CLASS WINDOW */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Booking Class
            </label>
            <div className="mt-1 flex rounded-xl border border-border bg-surface-alt p-1">
              <button
                type="button"
                onClick={() => setSelectedClassTab("ac")}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                  selectedClassTab === "ac"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                AC (10:00 AM)
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassTab("nonAc")}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                  selectedClassTab === "nonAc"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Sleeper (11:00 AM)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COUNTDOWN & CALENDAR COMMAND BAR */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white to-surface-alt p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  countdown.status === "LIVE"
                    ? "animate-ping bg-signal-green"
                    : countdown.status === "IMMINENT"
                      ? "animate-pulse bg-signal-red"
                      : "bg-signal-amber"
                }`}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Tatkal Window:{" "}
                {selectedClassTab === "ac"
                  ? "AC (10:00 AM IST)"
                  : "Sleeper (11:00 AM IST)"}
              </span>
            </div>
            <h2 className="mt-1 text-base font-semibold text-ink sm:text-lg">
              Booking opens on{" "}
              <span className="text-violet">
                {schedule.bookingDateFormatted}
              </span>{" "}
              for journey on <span>{schedule.journeyDate}</span>
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{countdown.message}</p>
          </div>

          {/* DIGITAL COUNTDOWN DISPLAY */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="rounded-xl border border-border bg-white px-3.5 py-2 text-center shadow-xs">
                <div className="font-mono text-xl font-extrabold text-ink sm:text-2xl">
                  {String(countdown.days * 24 + countdown.hours).padStart(
                    2,
                    "0",
                  )}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">
                  Hours
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-ink-dim">
                :
              </span>
              <div className="rounded-xl border border-border bg-white px-3.5 py-2 text-center shadow-xs">
                <div className="font-mono text-xl font-extrabold text-ink sm:text-2xl">
                  {String(countdown.minutes).padStart(2, "0")}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">
                  Min
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-ink-dim">
                :
              </span>
              <div className="rounded-xl border border-border bg-white px-3.5 py-2 text-center shadow-xs">
                <div className="font-mono text-xl font-extrabold text-violet sm:text-2xl">
                  {String(countdown.seconds).padStart(2, "0")}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">
                  Sec
                </div>
              </div>
            </div>

            {/* REMINDER ACTIONS */}
            <div className="flex flex-col gap-1.5">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet/30 bg-violet-soft px-3 py-2 text-xs font-semibold text-violet transition-colors hover:bg-violet hover:text-white"
              >
                <CalendarIcon size={13} />
                <span>Google Cal</span>
              </a>
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-violet/40 hover:text-ink"
              >
                <Download size={13} />
                <span>Apple/iCal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1-CLICK IRCTC PASSENGER MASTER STRING GENERATOR */}
      <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet" />
              <h3 className="font-display text-lg font-bold text-ink">
                1-Click IRCTC Passenger Master String
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Don&apos;t waste 45 precious seconds typing names on IRCTC!
              Pre-fill up to 4 passengers and copy formatted strings in 0.1s.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMasterList(!showMasterList)}
            className="rounded-lg p-2 text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            {showMasterList ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        </div>

        {showMasterList && (
          <div className="mt-5 space-y-4">
            {/* PASSENGERS FORM */}
            <div className="space-y-3">
              {passengers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-alt/60 p-3 sm:flex-nowrap"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft font-mono text-xs font-bold text-violet">
                    {idx + 1}
                  </span>

                  {/* NAME */}
                  <input
                    type="text"
                    placeholder="Passenger Name"
                    value={p.name}
                    onChange={(e) =>
                      updatePassenger(p.id, "name", e.target.value)
                    }
                    className="w-full min-w-[140px] flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-violet"
                  />

                  {/* AGE */}
                  <input
                    type="number"
                    placeholder="Age"
                    min="1"
                    max="120"
                    value={p.age}
                    onChange={(e) =>
                      updatePassenger(p.id, "age", e.target.value)
                    }
                    className="w-16 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-violet"
                  />

                  {/* GENDER */}
                  <select
                    value={p.gender}
                    onChange={(e) =>
                      updatePassenger(
                        p.id,
                        "gender",
                        e.target.value as "M" | "F" | "T",
                      )
                    }
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="T">Transgender</option>
                  </select>

                  {/* BERTH PREFERENCE */}
                  <select
                    value={p.berthPreference}
                    onChange={(e) =>
                      updatePassenger(p.id, "berthPreference", e.target.value)
                    }
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                  >
                    <option value="NP">No Preference</option>
                    <option value="LB">Lower Berth</option>
                    <option value="MB">Middle Berth</option>
                    <option value="UB">Upper Berth</option>
                    <option value="SL">Side Lower</option>
                    <option value="SU">Side Upper</option>
                  </select>

                  {/* FOOD */}
                  <select
                    value={p.foodPreference}
                    onChange={(e) =>
                      updatePassenger(
                        p.id,
                        "foodPreference",
                        e.target.value as "V" | "N" | "D",
                      )
                    }
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                  >
                    <option value="V">Veg</option>
                    <option value="N">Non-Veg</option>
                    <option value="D">No Food</option>
                  </select>

                  {/* REMOVE PASSENGER */}
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(p.id)}
                      className="rounded-lg p-1.5 text-ink-dim hover:bg-signal-red-soft hover:text-signal-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ACTIONS & UPI */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {passengers.length < 4 && (
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-violet hover:text-violet"
                  >
                    <UserPlus size={13} />
                    <span>Add Passenger ({passengers.length}/4)</span>
                  </button>
                )}
                <span className="text-[11px] text-ink-dim">
                  *IRCTC restricts Tatkal booking to 4 persons per ticket.
                </span>
              </div>

              {/* UPI VPA INPUT */}
              <div className="flex items-center gap-2">
                <label className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  UPI VPA:
                </label>
                <input
                  type="text"
                  placeholder="yourname@okaxis"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-mono text-ink outline-none focus:border-violet"
                />
              </div>
            </div>

            {/* 1-CLICK IRCTC AUTO-INJECTOR & MAGIC BOOKMARKLET */}
            <div className="mt-5 space-y-4 rounded-xl border border-violet/30 bg-violet-soft/25 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-display text-sm font-bold text-violet">
                    <Zap size={15} />
                    <span>
                      How to Auto-Populate All IRCTC Boxes in 0.05 Seconds
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    IRCTC has 15+ separate boxes (Name, Age, Gender, Berth,
                    UPI). Instead of typing each one while tickets vanish, use
                    our 1-click Auto-Injector:
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {/* MAGIC BOOKMARKLET (DRAGGABLE TO BROWSER BOOKMARKS BAR) */}
                  <a
                    href={autofillScripts.bookmarklet}
                    title="Drag this button to your Bookmarks Bar! Click it once on the IRCTC Passenger page to auto-fill all boxes."
                    onClick={(e) => {
                      // On click, provide helpful instruction or copy
                      handleCopy(autofillScripts.rawScript, "script");
                    }}
                    className="inline-flex cursor-grab items-center gap-1.5 rounded-xl bg-violet px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-violet-dark active:cursor-grabbing"
                  >
                    <Sparkles size={13} />
                    <span>
                      ⭐ Drag to Bookmarks: &quot;Wayvia Tatkal Fill&quot;
                    </span>
                  </a>

                  {/* COPY CONSOLE SCRIPT BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(autofillScripts.rawScript, "script")
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-violet/40 bg-white px-3 py-2 text-xs font-semibold text-violet shadow-2xs transition-colors hover:bg-violet-soft"
                  >
                    {copiedKey === "script" ? (
                      <>
                        <Check size={13} className="text-signal-green" />
                        <span className="text-signal-green">
                          Script Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy 1-Click Browser Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* THREE CONCRETE METHODS */}
              <div className="grid gap-3 pt-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-bold text-ink">
                    Method 1: Magic Bookmarklet
                  </div>
                  <p className="mt-1 text-[11.5px] leading-normal text-ink-muted">
                    Drag the button above to your browser bookmarks. When you
                    reach the IRCTC passenger page,{" "}
                    <strong>click the bookmark once</strong>. Every name, age,
                    berth &amp; UPI fills instantly.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-bold text-ink">
                    Method 2: Console Inject (F12)
                  </div>
                  <p className="mt-1 text-[11.5px] leading-normal text-ink-muted">
                    Click <strong>Copy 1-Click Script</strong>. On the IRCTC
                    passenger page, press{" "}
                    <kbd className="rounded bg-surface-alt px-1 py-0.5 font-mono text-[10px]">
                      F12
                    </kbd>{" "}
                    (Console), paste (
                    <kbd className="rounded bg-surface-alt px-1 py-0.5 font-mono text-[10px]">
                      Ctrl+V
                    </kbd>
                    ), and press Enter.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-bold text-ink">
                    Method 3: IRCTC Native Master List
                  </div>
                  <p className="mt-1 text-[11.5px] leading-normal text-ink-muted">
                    Go to <em>My Profile → Add Master List</em> on IRCTC 24h
                    before. During booking, click IRCTC&apos;s native{" "}
                    <strong>&quot;Add from Master List&quot;</strong> button to
                    select them via checkboxes.
                  </p>
                </div>
              </div>

              {/* MOBILE APP 1-TAP QUICK-COPY CHIPS */}
              <div className="border-t border-violet/15 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Mobile App Users (IRCTC Rail Connect) — 1-Tap Quick-Copy:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(masterStrings.singleLine, "single")
                      }
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-violet hover:underline"
                    >
                      {copiedKey === "single"
                        ? "✓ Copied Single Line"
                        : "Copy Single Line"}
                    </button>
                    <span className="text-ink-dim">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(masterStrings.multiLine, "multi")
                      }
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-violet hover:underline"
                    >
                      {copiedKey === "multi"
                        ? "✓ Copied Full Text"
                        : "Copy Full Text"}
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {passengers
                    .filter((p) => p.name.trim())
                    .map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 text-[11px]"
                      >
                        <span className="font-mono font-bold text-ink-muted px-1">
                          P{i + 1}:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(p.name, `name-${p.id}`)}
                          className="rounded bg-surface-alt px-1.5 py-0.5 font-medium text-ink transition-colors hover:bg-violet-soft hover:text-violet"
                          title="Click to copy Name"
                        >
                          {copiedKey === `name-${p.id}` ? "✓ Copied" : p.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(p.age, `age-${p.id}`)}
                          className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-ink transition-colors hover:bg-violet-soft hover:text-violet"
                          title="Click to copy Age"
                        >
                          {copiedKey === `age-${p.id}`
                            ? "✓ Copied"
                            : `${p.age}y`}
                        </button>
                      </div>
                    ))}

                  {upiVpa && (
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 text-[11px]">
                      <span className="font-mono font-bold text-ink-muted px-1">
                        UPI:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiVpa, "upi-chip")}
                        className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-ink transition-colors hover:bg-violet-soft hover:text-violet"
                        title="Click to copy UPI VPA"
                      >
                        {copiedKey === "upi-chip" ? "✓ Copied UPI" : upiVpa}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* TATKAL COMPETITION & QUOTA MATRIX */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-signal-red" />
              <h3 className="font-display text-xl font-bold text-ink">
                Tatkal Quota & Competition Matrix
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Live trains running between {fromCode} and {toCode}. Quotas &amp;
              exhaustion estimates based on historical train formation.
            </p>
          </div>

          <span className="rounded-full bg-surface-alt px-3 py-1 font-mono text-xs text-ink-muted">
            {trains.length} Trains Analyzed
          </span>
        </div>

        {loadingTrains ? (
          <div className="mt-6 rounded-2xl border border-border bg-white p-12 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-violet border-t-transparent" />
            <p className="mt-3 font-mono text-xs text-ink-muted">
              Querying live train schedules &amp; quotas...
            </p>
          </div>
        ) : trains.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-white p-10 text-center">
            <Train size={32} className="mx-auto text-ink-dim" />
            <p className="mt-2 text-sm text-ink-muted">
              No direct trains found between {fromCode} and {toCode}.
            </p>
            <Link
              href={`/journey-planner?from=${fromCode}&to=${toCode}&date=${journeyDate}`}
              className="mt-3 inline-block font-mono text-xs font-semibold text-violet hover:underline"
            >
              Discover connecting multimodal routes on Journey Planner →
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {trains.map((train) => {
              const formattedDate = schedule.bookingDateFormatted;
              const confirmTktUrl = `https://www.confirmtkt.com/rbooking/trains/from/${encodeURIComponent(
                fromCode,
              )}/to/${encodeURIComponent(toCode)}/${encodeURIComponent(formattedDate)}`;

              return (
                <div
                  key={train.trainNo}
                  className="rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:border-violet/40 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* TRAIN BASIC INFO */}
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-surface-alt px-2 py-0.5 font-mono text-xs font-bold text-ink">
                          {train.trainNo}
                        </span>
                        <h4 className="font-display text-base font-bold text-ink">
                          {train.trainName}
                        </h4>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${train.competitionBadgeClass}`}
                        >
                          {train.competitionLabel}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-muted">
                        <span>
                          Dep:{" "}
                          <strong className="text-ink">{train.depTime}</strong>{" "}
                          ({fromCode})
                        </span>
                        <span>→</span>
                        <span>
                          Arr:{" "}
                          <strong className="text-ink">{train.arrTime}</strong>{" "}
                          ({toCode})
                        </span>
                        <span>•</span>
                        <span>{train.duration}</span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={confirmTktUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-dark"
                      >
                        <span>Pre-fill ConfirmTkt</span>
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href="https://www.irctc.co.in/nget/train-search"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-violet"
                      >
                        <span>IRCTC Direct</span>
                      </a>
                    </div>
                  </div>

                  {/* METRICS STRIP: QUOTAS & EXHAUSTION */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-alt p-3 sm:grid-cols-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-dim">
                        Exhaustion Speed
                      </div>
                      <div className="font-mono text-xs font-bold text-ink">
                        {train.estimatedExhaustion}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-dim">
                        Est. 3A Tatkal Quota
                      </div>
                      <div className="font-mono text-xs font-bold text-ink">
                        ~{train.estimated3aQuota} seats
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-dim">
                        Est. SL Tatkal Quota
                      </div>
                      <div className="font-mono text-xs font-bold text-ink">
                        {train.estimatedSlQuota > 0
                          ? `~${train.estimatedSlQuota} seats`
                          : "No Sleeper Coach"}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-dim">
                        Est. 2A Tatkal Quota
                      </div>
                      <div className="font-mono text-xs font-bold text-ink">
                        ~{train.estimated2aQuota} seats
                      </div>
                    </div>
                  </div>

                  {/* PRO TIP */}
                  <div className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
                    <Info size={14} className="mt-0.5 shrink-0 text-violet" />
                    <span>
                      <strong className="text-ink">Pro Tactic:</strong>{" "}
                      {train.tacticalTip}
                    </span>
                  </div>

                  {/* FAILOVER PLAN B */}
                  <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-border-soft bg-white p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1.5 text-ink-muted">
                      <ShieldAlert size={14} className="text-signal-amber" />
                      <span>
                        <strong className="text-ink">Plan B Failover:</strong>{" "}
                        {train.failoverPlan.primaryAlternative}
                      </span>
                    </div>
                    <Link
                      href={`/journey-planner?from=${fromCode}&to=${toCode}&date=${journeyDate}`}
                      className="shrink-0 font-mono text-[11px] font-semibold text-violet hover:underline"
                    >
                      Search Wayvia Multi-Hop Alternate →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TATKAL WAR ROOM STRATEGY PLAYBOOK */}
      <section className="mt-12 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h3 className="font-display text-xl font-bold text-ink">
          The 4 Golden Rules of Winning Tatkal
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          Mastered by pro Indian travelers to secure confirmed seats within the
          critical 60-second window.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-xs text-white">
                1
              </span>
              Pre-create IRCTC Master List
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Add all passenger names to your IRCTC profile Master List 24 hours
              prior. During booking, a single click on &quot;Add from Master
              List&quot; populates all passenger rows in 0.5s instead of 40s.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-xs text-white">
                2
              </span>
              Always Pay via BHIM UPI
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Never use Debit/Credit cards or Netbanking during Tatkal. OTP SMS
              arrives late or times out. Entering your UPI ID routes an instant
              push payment notification directly to your phone.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-xs text-white">
                3
              </span>
              Sync Clock to Atomic IST
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              IRCTC runs strictly on Indian Standard Time. Log in at 09:48 AM
              for AC or 10:48 AM for Sleeper. Do NOT hit refresh at 10:00:00 —
              click &quot;Modify Search&quot; to fetch live availability without
              getting logged out.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-xs text-white">
                4
              </span>
              Activate the 2-Device Strategy
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Open the Rail Connect Mobile App on 5G mobile data, and the IRCTC
              Desktop Web portal on Wi-Fi using separate credentials. If one
              gateway lags, the other sails through.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED TATKAL GUIDES */}
      <RelatedBlogGuides
        title="Tatkal Booking Guides & War Room Tactics"
        subtitle="Learn the inside tricks, clock synchronization rules, and quota secrets to win Tatkal tickets."
        guides={[
          {
            slug: "irctc-tatkal-booking-secrets-60-second-guide-2026",
            title: "IRCTC Tatkal Booking in 60 Seconds: The 2026 Master Guide",
            excerpt:
              "How to beat IRCTC server lag, captcha errors, and checkout timeouts with atomic clock synchronization.",
            category: "Rail",
            readTime: "8 min read",
          },
          {
            slug: "premium-tatkal-vs-tatkal-difference",
            title:
              "Tatkal vs Premium Tatkal: Which One Should You Actually Book?",
            excerpt:
              "Dynamic fare surge caps, availability odds, and why Premium Tatkal acts as the ultimate emergency backup.",
            category: "Tips",
            readTime: "7 min read",
          },
          {
            slug: "irctc-tatkal-booking-2026-timings-rules",
            title:
              "IRCTC Tatkal Booking 2026: Timings, Rules & Confirmed Berths",
            excerpt:
              "Opening timings for AC and Sleeper, agent booking restrictions, and payment gateway optimizations.",
            category: "Tips",
            readTime: "6 min read",
          },
        ]}
      />
    </main>
  );
}
