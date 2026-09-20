/**
 * Tatkal Calculation & Rules Engine
 *
 * Rules:
 * - AC Tatkal (1A, 2A, 3A, 3E, CC, EC) opens at 10:00:00 AM IST on the day prior to train origin departure (D-1).
 * - Non-AC Tatkal (SL, 2S) opens at 11:00:00 AM IST on the day prior to train origin departure (D-1).
 * - Premium Tatkal (PT) opens at the same times with dynamic surge pricing.
 * - Maximum 4 passengers per Tatkal PNR.
 */

export interface TatkalSchedule {
  journeyDate: string; // YYYY-MM-DD
  bookingDate: string; // YYYY-MM-DD (D-1)
  bookingDateFormatted: string; // DD-MM-YYYY
  acOpeningIso: string; // ISO string for 10:00 AM IST on D-1
  nonAcOpeningIso: string; // ISO string for 11:00 AM IST on D-1
  acOpeningMs: number;
  nonAcOpeningMs: number;
}

export type TatkalStatus = "UPCOMING" | "IMMINENT" | "LIVE" | "CLOSED";

export interface CountdownResult {
  status: TatkalStatus;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  message: string;
}

export type CompetitionLevel = "EXTREME" | "MODERATE" | "HIGH_CHANCE";

export interface TrainTatkalProfile {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  depTime: string;
  arrTime: string;
  duration: string;
  competitionLevel: CompetitionLevel;
  competitionLabel: string;
  competitionBadgeClass: string;
  estimatedExhaustion: string;
  estimated3aQuota: number;
  estimatedSlQuota: number;
  estimated2aQuota: number;
  tacticalTip: string;
  failoverPlan: {
    primaryAlternative: string;
    multimodalFallback: string;
  };
}

export interface PassengerDetail {
  id: string;
  name: string;
  age: string;
  gender: "M" | "F" | "T";
  berthPreference: "LB" | "MB" | "UB" | "SL" | "SU" | "NP";
  foodPreference: "V" | "N" | "D"; // Veg, Non-Veg, Don't want
}

/**
 * Calculates the exact Tatkal opening timestamps (AC at 10:00 AM IST, Non-AC at 11:00 AM IST)
 * for a given journey date (YYYY-MM-DD).
 */
export function getTatkalOpeningSchedule(journeyDateStr: string): TatkalSchedule {
  const parts = journeyDateStr.slice(0, 10).split("-").map(Number);
  const [year, month, day] = parts;

  // Journey date in UTC
  const journeyDate = new Date(Date.UTC(year, month - 1, day));

  // Booking date is D - 1
  const bookingDate = new Date(journeyDate.getTime());
  bookingDate.setUTCDate(bookingDate.getUTCDate() - 1);

  const bYear = bookingDate.getUTCFullYear();
  const bMonth = bookingDate.getUTCMonth();
  const bDay = bookingDate.getUTCDate();

  // IST is UTC+05:30.
  // 10:00 AM IST = 04:30 AM UTC
  const acOpening = new Date(Date.UTC(bYear, bMonth, bDay, 4, 30, 0, 0));
  // 11:00 AM IST = 05:30 AM UTC
  const nonAcOpening = new Date(Date.UTC(bYear, bMonth, bDay, 5, 30, 0, 0));

  const pad = (n: number) => String(n).padStart(2, "0");
  const bookingDateIso = `${bYear}-${pad(bMonth + 1)}-${pad(bDay)}`;
  const bookingDateFormatted = `${pad(bDay)}-${pad(bMonth + 1)}-${bYear}`;

  return {
    journeyDate: journeyDateStr,
    bookingDate: bookingDateIso,
    bookingDateFormatted,
    acOpeningIso: acOpening.toISOString(),
    nonAcOpeningIso: nonAcOpening.toISOString(),
    acOpeningMs: acOpening.getTime(),
    nonAcOpeningMs: nonAcOpening.getTime(),
  };
}

/**
 * Calculates remaining countdown to a specific target opening timestamp (in ms).
 */
export function calculateCountdown(targetMs: number, nowMs: number = Date.now()): CountdownResult {
  const diff = targetMs - nowMs;

  if (diff <= 0) {
    // Within 2 hours after opening, consider it LIVE
    if (diff > -2 * 60 * 60 * 1000) {
      return {
        status: "LIVE",
        totalMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        message: "Tatkal booking is LIVE now! Quotas are exhausting rapidly.",
      };
    }
    return {
      status: "CLOSED",
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      message: "Tatkal window for this date has closed. Charting may have commenced.",
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // If less than 15 minutes remain
  const isImminent = diff <= 15 * 60 * 1000;

  return {
    status: isImminent ? "IMMINENT" : "UPCOMING",
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    message: isImminent
      ? "Booking opens in under 15 minutes! Open IRCTC and log in now."
      : `Opens in ${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`,
  };
}

/**
 * Analyzes a train and assigns Tatkal competition profiles, quota estimates, and failover options.
 */
export function analyzeTrainTatkal(train: {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  from_time?: string;
  to_time?: string;
  travel_time?: string;
}): TrainTatkalProfile {
  const name = train.trainName.toUpperCase();
  const no = train.trainNo;

  let level: CompetitionLevel = "MODERATE";
  let label = "Moderate Competition";
  let badgeClass = "bg-signal-amber-soft text-signal-amber border-signal-amber/30";
  let exhaustion = "2–5 minutes";
  let quota3a = 48;
  let quotaSl = 96;
  let quota2a = 12;
  let tip = "Target 3A for higher seat count; keep UPI QR ready for instantaneous checkout.";
  let primaryAlt = "Shift to 11:00 AM Sleeper Tatkal or check quota from preceding major junction.";
  let multimodal = "Overnight AC sleeper bus connection via Wayvia Journey Planner.";

  // Premier / High speed
  if (
    name.includes("RAJDHANI") ||
    name.includes("SHATABDI") ||
    name.includes("DURONTO") ||
    name.includes("VANDE BHARAT") ||
    name.includes("TEJAS")
  ) {
    level = "EXTREME";
    label = "Extreme Battleground";
    badgeClass = "bg-signal-red-soft text-signal-red border-signal-red/30";
    exhaustion = "< 60 to 90 seconds";
    quota3a = 96;
    quotaSl = 0; // Most Rajdhani/Shatabdi/VB have no SL
    quota2a = 24;
    tip = "Quota vanishes within 45-60 seconds. Do not select berth preference; use IRCTC Master List.";
    primaryAlt = "Next fastest Superfast train departing within 3 hours.";
    multimodal = "High-speed daytime connecting train or executive bus transfer.";
  } else if (
    name.includes("SUPERFAST") ||
    name.includes("SF") ||
    name.includes("EXP") ||
    name.includes("MAIL")
  ) {
    level = "MODERATE";
    label = "Moderate Competition";
    badgeClass = "bg-signal-amber-soft text-signal-amber border-signal-amber/30";
    exhaustion = "3–8 minutes";
    quota3a = 48;
    quotaSl = 120;
    quota2a = 12;
    tip = "Higher number of Sleeper coaches gives strong probability at 11:00 AM window.";
    primaryAlt = "Check same-train intermediate junction split ticket on Wayvia.";
    multimodal = "Intercity bus / train combination.";
  } else if (name.includes("SPECIAL") || name.includes("SPL") || name.includes("PASSENGER")) {
    level = "HIGH_CHANCE";
    label = "High Booking Probability";
    badgeClass = "bg-signal-green-soft text-signal-green border-signal-green/30";
    exhaustion = "15+ minutes";
    quota3a = 32;
    quotaSl = 80;
    quota2a = 8;
    tip = "Lowest bot competition. Great fallback when flagship trains are sold out.";
    primaryAlt = "Direct booking usually has seats available even 20 mins post opening.";
    multimodal = "Local express train.";
  }

  return {
    trainNo: no,
    trainName: train.trainName,
    from: train.from,
    to: train.to,
    depTime: train.from_time || "Scheduled",
    arrTime: train.to_time || "Scheduled",
    duration: train.travel_time || "N/A",
    competitionLevel: level,
    competitionLabel: label,
    competitionBadgeClass: badgeClass,
    estimatedExhaustion: exhaustion,
    estimated3aQuota: quota3a,
    estimatedSlQuota: quotaSl,
    estimated2aQuota: quota2a,
    tacticalTip: tip,
    failoverPlan: {
      primaryAlternative: primaryAlt,
      multimodalFallback: multimodal,
    },
  };
}

/**
 * Generates a direct Google Calendar event URL for a Tatkal reminder.
 * Sets the reminder 15 minutes before the opening window.
 */
export function generateGoogleCalendarUrl(params: {
  trainName?: string;
  from: string;
  to: string;
  targetOpeningIso: string;
  type: "AC (10:00 AM)" | "Sleeper (11:00 AM)";
}): string {
  const targetDate = new Date(params.targetOpeningIso);
  // Reminder starts 15 mins before
  const startReminder = new Date(targetDate.getTime() - 15 * 60 * 1000);
  // Reminder ends 15 mins after opening
  const endReminder = new Date(targetDate.getTime() + 15 * 60 * 1000);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const title = encodeURIComponent(`🚨 IRCTC Tatkal Window: ${params.type} (${params.from} → ${params.to})`);
  const details = encodeURIComponent(
    `IRCTC Tatkal booking opens at ${targetDate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST.\n\n` +
      `Train: ${params.trainName || "Route Search"}\n` +
      `Origin: ${params.from} | Destination: ${params.to}\n\n` +
      `⚡ Pre-fill Checklist:\n` +
      `1. Log in to IRCTC at 09:48 AM / 10:48 AM.\n` +
      `2. Verify passenger master list.\n` +
      `3. Keep BHIM UPI ready for OTP-free payment.\n\n` +
      `Generated by Wayvia Tatkal Command Center: https://wayvia.xyz/tatkal-matrix`
  );
  const location = encodeURIComponent("https://www.irctc.co.in/nget/train-search");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(
    startReminder
  )}/${formatGCalDate(endReminder)}&details=${details}&location=${location}`;
}

/**
 * Generates an iCalendar (.ics) format string for Apple Calendar and Outlook.
 */
export function generateIcsContent(params: {
  trainName?: string;
  from: string;
  to: string;
  targetOpeningIso: string;
  type: "AC (10:00 AM)" | "Sleeper (11:00 AM)";
}): string {
  const targetDate = new Date(params.targetOpeningIso);
  const startReminder = new Date(targetDate.getTime() - 15 * 60 * 1000);
  const endReminder = new Date(targetDate.getTime() + 15 * 60 * 1000);

  const formatIcs = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wayvia//Tatkal Command Center//EN",
    "BEGIN:VEVENT",
    `UID:tatkal-${params.from}-${params.to}-${startReminder.getTime()}@wayvia.xyz`,
    `DTSTAMP:${formatIcs(new Date())}`,
    `DTSTART:${formatIcs(startReminder)}`,
    `DTEND:${formatIcs(endReminder)}`,
    `SUMMARY:🚨 IRCTC Tatkal Window: ${params.type} (${params.from} -> ${params.to})`,
    `DESCRIPTION:IRCTC Tatkal booking opens at ${targetDate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST. Pre-fill your passengers on Wayvia: https://wayvia.xyz/tatkal-matrix`,
    "URL:https://www.irctc.co.in/nget/train-search",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tatkal Booking opens in 15 minutes! Log in to IRCTC.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Formats passenger details into instant copy-paste strings for IRCTC autofill extensions / forms.
 */
export function formatPassengerMasterList(
  passengers: PassengerDetail[],
  upiVpa?: string
): {
  singleLine: string;
  multiLine: string;
  tableData: string;
} {
  const berthNames: Record<string, string> = {
    LB: "Lower",
    MB: "Middle",
    UB: "Upper",
    SL: "Side Lower",
    SU: "Side Upper",
    NP: "No Preference",
  };

  const foodNames: Record<string, string> = {
    V: "Veg",
    N: "Non-Veg",
    D: "No Food",
  };

  const lines = passengers.map((p, idx) => {
    return `${idx + 1}. ${p.name || "Passenger"} | Age: ${p.age || "--"} | Gender: ${p.gender} | Berth: ${
      berthNames[p.berthPreference]
    } | Food: ${foodNames[p.foodPreference]}`;
  });

  const singleLine = passengers
    .map((p) => `${p.name},${p.age},${p.gender},${p.berthPreference}`)
    .join(" ; ");

  let multiLine = lines.join("\n");
  if (upiVpa) {
    multiLine += `\nPayment UPI VPA: ${upiVpa}`;
  }

  const tableData = passengers
    .map((p) => `${p.name}\t${p.age}\t${p.gender}\t${berthNames[p.berthPreference]}`)
    .join("\n");

  return { singleLine, multiLine, tableData };
}

/**
 * Generates an executable JavaScript Bookmarklet and Browser Console Script that
 * auto-injects all passengers, berth choices, and payment modes into the IRCTC
 * web booking page with one click.
 */
export function generateAutofillScript(
  passengers: PassengerDetail[],
  upiVpa?: string
): {
  bookmarklet: string;
  rawScript: string;
} {
  const cleanPsg = passengers
    .filter((p) => p.name.trim())
    .map((p) => ({
      name: p.name.trim(),
      age: p.age.trim() || "30",
      gender: p.gender,
      berth: p.berthPreference,
      food: p.foodPreference,
    }));

  const rawScript = `(function() {
  const passengers = ${JSON.stringify(cleanPsg)};
  const upi = ${JSON.stringify(upiVpa || "")};

  function trigger(el, val) {
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  passengers.forEach((p, idx) => {
    if (idx > 0) {
      const addBtn = document.querySelector('.add-passenger-btn, a[aria-label*="Add Passenger"], span.fa-plus-circle');
      if (addBtn) addBtn.click();
    }
    setTimeout(() => {
      const nameInputs = document.querySelectorAll('input[formcontrolname="passengerName"], input[placeholder*="Passenger Name"], p-autocomplete input');
      const ageInputs = document.querySelectorAll('input[formcontrolname="passengerAge"], input[placeholder*="Age"]');
      const genderSelects = document.querySelectorAll('select[formcontrolname="passengerGender"]');
      const berthSelects = document.querySelectorAll('select[formcontrolname="passengerBerthChoice"]');

      if (nameInputs[idx]) trigger(nameInputs[idx], p.name);
      if (ageInputs[idx]) trigger(ageInputs[idx], p.age);
      if (genderSelects[idx]) trigger(genderSelects[idx], p.gender);
      if (berthSelects[idx] && p.berth !== 'NP') trigger(berthSelects[idx], p.berth);
    }, idx * 120 + 80);
  });

  setTimeout(() => {
    const upiRadio = document.querySelector('mat-radio-button[value="3"], input[value="3"], #mat-radio-3');
    if (upiRadio) {
      upiRadio.click();
      upiRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, passengers.length * 150 + 100);

  console.log('✅ Wayvia: Populated ' + passengers.length + ' passengers on IRCTC!');
})();`;

  const bookmarklet = `javascript:${encodeURIComponent(rawScript.replace(/\n\s*/g, " "))}`;

  return { bookmarklet, rawScript };
}

