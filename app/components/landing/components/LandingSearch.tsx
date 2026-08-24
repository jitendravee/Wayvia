"use client";

import { ArrowLeftRight, Calendar } from "lucide-react";
import React, { useRef, useState } from "react";
import StationInput from "../../StationInput";
import JourneySearchButton from "../../JourneySearchButton";
import { todayIso, formatDatePretty } from "@/lib/date";

// The hero only ever asks for the three things every trip needs — where
// from, where to, and when. Class, quota, and everything else train-specific
// live as filters on the journey planner once real results are on screen, so
// this box stays valid however many modes (train/bus/flight) end up behind it.
const glassLabel = "font-display text-[12px] text-ink/70";
const glassInput =
  "w-full bg-transparent p-0 font-semibold text-[14px] text-ink outline-none placeholder:text-ink/40 placeholder:font-normal";

const LandingSearch = () => {
  const [from, setFrom] = useState("NDLS");
  const [to, setTo] = useState("BCT");
  const [date, setDate] = useState(todayIso());
  const [touched, setTouched] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  }

  const invalid = !from.trim() || !to.trim() || from.trim().toUpperCase() === to.trim().toUpperCase();

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-white/40 via-white/55 to-white/70 p-4 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <StationInput
              id="hero-from"
              label="From"
              value={from}
              onChange={setFrom}
              placeholder="Delhi or NDLS"
              labelClassName={glassLabel}
              inputClassName={glassInput}
            />
          </div>

          <button
            type="button"
            onClick={swap}
            title="Swap origin/destination"
            aria-label="Swap origin and destination"
            className="w-11 h-11 shrink-0 self-center text-[14px] bg-ink/10 flex items-center justify-center rounded-full transition-transform hover:rotate-180"
          >
            <ArrowLeftRight className="text-ink/90" size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <StationInput
              id="hero-to"
              label="To"
              value={to}
              onChange={setTo}
              placeholder="Mumbai or BCT"
              labelClassName={glassLabel}
              inputClassName={glassInput}
            />
          </div>

          <div className="hidden sm:block mx-1 w-px self-stretch bg-ink/15" />

          <div className="flex flex-col gap-1.5">
            <p className={glassLabel}>Date</p>
            <button
              type="button"
              onClick={openDatePicker}
              className="flex flex-row items-center gap-1.5 text-left"
            >
              <Calendar size={18} className="text-ink/70" />
              <span className="font-semibold text-ink text-[14px]">{formatDatePretty(date)}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              tabIndex={-1}
              className="sr-only"
            />
          </div>
        </div>

        <JourneySearchButton
          from={from}
          to={to}
          date={date}
          size="lg"
          className="w-full sm:w-auto"
          disabled={invalid && touched}
          onBeforeNavigate={() => {
            setTouched(true);
            if (invalid) return false;
          }}
        />
      </div>

      {touched && invalid && (
        <p className="mt-2 font-mono text-[11px] text-signal-red">
          Pick two different stations to search.
        </p>
      )}
    </div>
  );
};

export default LandingSearch;