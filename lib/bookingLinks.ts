import type { AnnotatedLeg } from "@/app/types";
import { getStationCityName } from "./geo";

export interface BookingProviderOption {
  id: string;
  name: string;
  badge?: string;
  url: string;
  isPrimary?: boolean;
}

/** Formats a date string (e.g. YYYY-MM-DD) into DDMMYYYY for ConfirmTkt */
function formatDDMMYYYY(dateStr?: string): string {
  if (!dateStr) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}${month}${d.getFullYear()}`;
  }
  const clean = dateStr.slice(0, 10);
  const parts = clean.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y}`;
  }
  return dateStr.replace(/\D/g, "");
}

/** Formats date into DD-MMM-YYYY for RedBus (e.g. "15-Sep-2026") */
function formatRedbusDate(dateStr?: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = dateStr ? new Date(`${dateStr.slice(0, 10)}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
}

/** Clean city string for bus provider URLs */
function getCleanCityForBus(input: string): string {
  const city = getStationCityName(input);
  return city
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Returns booking provider links for a train leg.
 * ConfirmTkt pre-fills the origin, destination, date, and train search directly.
 */
export function getTrainBookingProviders(params: {
  from: string;
  to: string;
  date?: string;
  trainNo?: string;
  travelClass?: string;
}): BookingProviderOption[] {
  const { from, to, date, trainNo } = params;
  const fromCode = from.trim().toUpperCase();
  const toCode = to.trim().toUpperCase();
  const dateFormatted = formatDDMMYYYY(date);

  // ConfirmTkt deep link with pre-filled stations and journey date
  const confirmTktUrl = `https://www.confirmtkt.com/rbooking/trains?fromStationCode=${encodeURIComponent(
    fromCode
  )}&toStationCode=${encodeURIComponent(toCode)}&journeyDate=${encodeURIComponent(dateFormatted)}`;

  // Ixigo Trains route search
  const ixigoUrl = `https://www.ixigo.com/trains/${encodeURIComponent(fromCode)}-to-${encodeURIComponent(
    toCode
  )}-trains`;

  // IRCTC official portal
  const irctcUrl = "https://www.irctc.co.in/nget/train-search";

  return [
    {
      id: "confirmtkt",
      name: "ConfirmTkt",
      badge: "Instant Pre-fill",
      url: confirmTktUrl,
      isPrimary: true,
    },
    {
      id: "ixigo",
      name: "Ixigo Trains",
      badge: "Live Status",
      url: ixigoUrl,
    },
    {
      id: "irctc",
      name: "IRCTC Official",
      url: irctcUrl,
    },
  ];
}

/**
 * Returns booking provider links for a bus leg.
 * Falls back to RedBus / AbhiBus deep links so links are never null.
 */
export function getBusBookingProviders(params: {
  from: string;
  to: string;
  date?: string;
  existingUrl?: string | null;
}): BookingProviderOption[] {
  const { from, to, date, existingUrl } = params;
  const fromSlug = getCleanCityForBus(from);
  const toSlug = getCleanCityForBus(to);
  const redbusDate = formatRedbusDate(date);

  const redbusUrl = redbusDate
    ? `https://www.redbus.in/bus-tickets/${encodeURIComponent(fromSlug)}-to-${encodeURIComponent(toSlug)}?date=${encodeURIComponent(redbusDate)}`
    : `https://www.redbus.in/bus-tickets/${encodeURIComponent(fromSlug)}-to-${encodeURIComponent(toSlug)}`;

  const abhibusUrl = `https://www.abhibus.com/bus_search/${encodeURIComponent(fromSlug)}/${encodeURIComponent(toSlug)}`;

  const options: BookingProviderOption[] = [];

  if (existingUrl && existingUrl !== "null" && existingUrl.startsWith("http")) {
    options.push({
      id: "ixigo_bus",
      name: "Ixigo Bus",
      badge: "Direct Route",
      url: existingUrl,
      isPrimary: true,
    });
    options.push({
      id: "redbus",
      name: "RedBus",
      url: redbusUrl,
    });
  } else {
    options.push({
      id: "redbus",
      name: "RedBus",
      badge: "Fast Search",
      url: redbusUrl,
      isPrimary: true,
    });
  }

  options.push({
    id: "abhibus",
    name: "AbhiBus",
    url: abhibusUrl,
  });

  return options;
}

/**
 * Returns booking provider links for a flight leg.
 */
export function getFlightBookingProviders(params: {
  from: string;
  to: string;
  date?: string;
}): BookingProviderOption[] {
  const { from, to, date } = params;
  const gFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(
    from
  )}+to+${encodeURIComponent(to)}${date ? `+on+${encodeURIComponent(date)}` : ""}`;

  return [
    {
      id: "google_flights",
      name: "Google Flights",
      badge: "Best Fare Finder",
      url: gFlightsUrl,
      isPrimary: true,
    },
  ];
}

/**
 * High-level helper to retrieve all options for a given leg.
 */
export function getLegBookingOptions(leg: AnnotatedLeg, date?: string): BookingProviderOption[] {
  if (leg.mode === "bus") {
    return getBusBookingProviders({
      from: leg.from,
      to: leg.to,
      date,
      existingUrl: leg.bookingUrl,
    });
  }
  if (leg.mode === "flight") {
    return getFlightBookingProviders({
      from: leg.from,
      to: leg.to,
      date,
    });
  }
  return getTrainBookingProviders({
    from: leg.from,
    to: leg.to,
    date,
    trainNo: leg.trainNo,
  });
}

/**
 * Returns a guaranteed valid, non-null booking URL for a leg.
 */
export function getPrimaryBookingUrl(leg: AnnotatedLeg, date?: string): string {
  const options = getLegBookingOptions(leg, date);
  const primary = options.find((o) => o.isPrimary) || options[0];
  return primary?.url || "https://www.irctc.co.in/nget/train-search";
}

