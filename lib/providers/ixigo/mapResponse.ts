import type { Leg } from "../../graph/types";
import type { AvlAvailability, AvlStatusCategory } from "../../erail/avl";
import type { IxigoServiceDetail, IxigoAutocompleteResult } from "./types";
import { minutesToHHMM } from "../types";
import { ixigoAutocomplete } from "./client";

/** Midnight of `date` ('YYYY-MM-DD'), as an epoch ms, in IST. India has no DST so a fixed +05:30 offset is always correct. */
function istMidnightEpochMs(date: string): number {
  return Date.parse(`${date}T00:00:00+05:30`);
}

/** Cache for ixigo city IDs to avoid repeated lookups for booking URLs */
export const ixigoCityIds: Map<string, number> = new Map();

/**
 * Populates the ixigo city ID cache with results from an autocomplete query.
 * This should be called whenever we get search results to keep the cache warm.
 */
export async function populateIxigoCityCache(query: string): Promise<void> {
  try {
    const results = await ixigoAutocomplete(query);
    for (const result of results) {
      // Only cache actual city records (not sub-entities like airports)
      if (result.alias_type === "City" && result.stn_rfn === 1) {
        ixigoCityIds.set(result.label.toLowerCase(), result.id);
        // Also cache common variations
        ixigoCityIds.set(result.label.toLowerCase().trim(), result.id);
      }
    }
  } catch (err) {
    console.error("Failed to populate ixigo city cache:", err);
  }
}

/**
 * Sets the ixigo city ID in the cache for a given city label.
 * @param cityLabel The city label (as resolved from station name)
 * @param cityId The ixigo city ID
 */
export function setIxigoCityId(cityLabel: string, cityId: number): void {
  const lower = cityLabel.toLowerCase();
  ixigoCityIds.set(lower, cityId);
  ixigoCityIds.set(lower.trim(), cityId);
}

/**
 * Maps one ixigo `serviceDetailsList` entry to our Leg shape, anchored to
 * the search date's midnight the exact same way train legs are (see
 * lib/graph/discover.ts's withAbsoluteTimes) — so a bus leg's depAbsMin/
 * arrAbsMin compare directly against a train leg's when building mixed
 * train+bus candidates, no separate unit-conversion needed downstream.
 *
 * Returns null (rather than throwing) for a malformed entry — one bad
 * record from ixigo shouldn't drop every other bus on the list.
 */
export function mapIxigoServiceToLeg(item: IxigoServiceDetail, from: string, to: string, searchDate: string): Leg | null {
  const midnightMs = istMidnightEpochMs(searchDate);

  const depMs = item.startTimestamp ? item.startTimestamp * 1000 : Date.parse(item.startTimeDateFormat);
  if (!depMs || Number.isNaN(depMs)) return null;

  let arrMs = item.arriveTimestamp ? item.arriveTimestamp * 1000 : NaN;
  if (Number.isNaN(arrMs)) {
    // No arrival timestamp — fall back to departure + travelTime ("HH:MM:SS").
    const [h, m, s] = (item.travelTime ?? "0:0:0").split(":").map(Number);
    arrMs = depMs + ((h || 0) * 60 + (m || 0)) * 60000 + (s || 0) * 1000;
  }

  const depAbsMin = Math.round((depMs - midnightMs) / 60000);
  const arrAbsMin = Math.round((arrMs - midnightMs) / 60000);
  const durationMin = Math.max(1, arrAbsMin - depAbsMin);

  const seatsLeft = Number(item.availableSeats) || 0;
  const category: AvlStatusCategory = seatsLeft === 0 ? "NOT_AVAILABLE" : seatsLeft <= 3 ? "RAC" : "AVAILABLE";
  const availability: AvlAvailability = {
    key: `ixigo-bus-${item.serviceKey}`,
    category,
    count: seatsLeft,
    rawStatus:
      category === "AVAILABLE" ? `AVAILABLE ${seatsLeft}` : category === "RAC" ? `${seatsLeft} left` : "SOLD OUT",
    rawNums: "",
  };

  const fareNum = Number(item.sortFare ?? item.fare);
  const fare = Number.isFinite(fareNum) && fareNum > 0 ? fareNum : null;

  const operator = item.travelerAgentName || item.serviceName || "Bus operator";
  const busType = item.busTypeName ? ` · ${item.busTypeName}` : "";
return {
  mode: "bus",
  source: "live",
  trainNo: String(
    item.serviceKey ??
    item.masterId ??
    `${from}-${to}-${depAbsMin}`
  ),
  trainName: `${operator}${busType}`,
  from,
  to,
  departure: minutesToHHMM(depAbsMin),
  arrival: minutesToHHMM(arrAbsMin),
  travelTime: minutesToHHMM(durationMin),
  runningDays: "1111111",
  depAbsMin,
  arrAbsMin,

  bookingUrl: buildIxigoBusBookingUrl(from, to, searchDate),

  precomputed: { availability, fare },
};
}

function formatIxigoDate(date:string) {
  // YYYY-MM-DD -> DD-MM-YYYY
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

function buildIxigoBusBookingUrl(from:string, to:string, date:string) {
  const fromId = ixigoCityIds.get(from.toLowerCase()) || ixigoCityIds.get(from.toLowerCase().trim());
  const toId = ixigoCityIds.get(to.toLowerCase()) || ixigoCityIds.get(to.toLowerCase().trim());

  if (!fromId || !toId) {
    return null; // or construct a generic search URL if preferred
  }

  const ixigoDate = formatIxigoDate(date);

  return `https://www.ixigo.com/buses/bus_search/${encodeURIComponent(from)}/${fromId}/${encodeURIComponent(to)}/${toId}/${ixigoDate}/O`;
}