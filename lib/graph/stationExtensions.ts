import { getRoute } from "../erail/client";
import type { BetweenStationEntry, RouteStop } from "../erail/prettify";
import type { Leg, JourneyCandidate } from "./types";
import { DEFAULT_HUBS } from "./hubs";

/** Cache train route stops by train number to avoid repeat lookups during search. */
const routeStopCache = new Map<string, Promise<RouteStop[] | null>>();

function fetchTrainRouteStops(trainNo: string): Promise<RouteStop[] | null> {
  let pending = routeStopCache.get(trainNo);
  if (pending) return pending;

  pending = (async () => {
    try {
      const res = await getRoute(trainNo);
      if (!res || !res.success || !Array.isArray(res.data)) return null;
      return res.data as RouteStop[];
    } catch {
      return null;
    }
  })();

  routeStopCache.set(trainNo, pending);
  return pending;
}

function toMinutes(time: string): number {
  const norm = time.replace(".", ":");
  const [h, m] = norm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function withAbsoluteTimes(
  leg: Omit<Leg, "depAbsMin" | "arrAbsMin">,
  dayOffset: number
): Leg {
  const depMin = toMinutes(leg.departure);
  const travelMin = toMinutes(leg.travelTime);
  const depAbsMin = dayOffset * 1440 + depMin;
  const arrAbsMin = depAbsMin + travelMin;
  return { ...leg, depAbsMin, arrAbsMin };
}

const MAJOR_JUNCTION_CODES = new Set(DEFAULT_HUBS.map((h) => h.code.toUpperCase()));

/**
 * Discovers same-train splits, origin extensions, and destination extensions
 * for direct trains running between `fromCode` and `toCode`.
 */
export async function discoverStationExtensions(
  fromCode: string,
  toCode: string,
  directEntries: BetweenStationEntry[],
  date: string
): Promise<JourneyCandidate[]> {
  const fromUpper = fromCode.toUpperCase();
  const toUpper = toCode.toUpperCase();
  const candidates: JourneyCandidate[] = [];

  // Limit processing to top 8 direct trains to keep latency bounded
  const sampleEntries = directEntries.slice(0, 8);

  // 1. Origin Extensions & Destination Extensions
  for (const entry of sampleEntries) {
    const t = entry.train_base;
    const sourceCode = (t.source_stn_code || "").toUpperCase();
    const destCode = (t.dstn_stn_code || "").toUpperCase();

    // Origin Extension (Boarding Point Shift):
    // If the train originates earlier than `fromCode`, booking from `sourceCode`
    // with boarding point set to `fromCode` often accesses the massive General Quota pool.
    if (sourceCode && sourceCode !== fromUpper) {
      const originLeg: Omit<Leg, "depAbsMin" | "arrAbsMin"> = {
        mode: "train",
        source: "live",
        trainNo: t.train_no,
        trainName: t.train_name,
        from: sourceCode,
        to: toUpper,
        departure: t.from_time,
        arrival: t.to_time,
        travelTime: t.travel_time,
        runningDays: t.running_days,
        bookingUrl: "https://www.irctc.co.in/nget/train-search",
        boardingStation: fromUpper,
      };

      candidates.push({
        legs: [withAbsoluteTimes(originLeg, 0)],
        extensionType: "origin_extension",
      });
    }

    // Destination Extension (Beyond Station Shift):
    // If the train terminates farther than `toCode`, booking to `destCode`
    // and alighting at `toCode` can bypass waitlisted intermediate quotas.
    if (destCode && destCode !== toUpper) {
      const destLeg: Omit<Leg, "depAbsMin" | "arrAbsMin"> = {
        mode: "train",
        source: "live",
        trainNo: t.train_no,
        trainName: t.train_name,
        from: fromUpper,
        to: destCode,
        departure: t.from_time,
        arrival: t.to_time,
        travelTime: t.travel_time,
        runningDays: t.running_days,
        bookingUrl: "https://www.irctc.co.in/nget/train-search",
        deboardingStation: toUpper,
      };

      candidates.push({
        legs: [withAbsoluteTimes(destLeg, 0)],
        extensionType: "dest_extension",
      });
    }
  }

  // 2. Same-Train Splits (Dual PNR on the EXACT same train)
  // For trains with travel times > 4 hours, fetch intermediate stops and find candidate split stations
  const splitPromises = sampleEntries.slice(0, 5).map(async (entry) => {
    const t = entry.train_base;
    const stops = await fetchTrainRouteStops(t.train_no);
    if (!stops || stops.length < 4) return [];

    const fromIdx = stops.findIndex(
      (s) => s.source_stn_code.toUpperCase() === fromUpper
    );
    const toIdx = stops.findIndex(
      (s) => s.source_stn_code.toUpperCase() === toUpper
    );

    // Ensure `from` occurs before `to` along the route
    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return [];

    // Potential split points between fromIdx and toIdx
    const intermediateStops = stops.slice(fromIdx + 1, toIdx);
    if (intermediateStops.length === 0) return [];

    // Prioritize major junctions or midpoint stations
    const scoredSplits = intermediateStops.map((stop, idx) => {
      const code = stop.source_stn_code.toUpperCase();
      const isJunction = MAJOR_JUNCTION_CODES.has(code);
      // Prefer stations near the middle of the leg sequence
      const midpointDist = Math.abs(idx - intermediateStops.length / 2);
      const score = (isJunction ? 10 : 0) - midpointDist;
      return { stop, score };
    });

    scoredSplits.sort((a, b) => b.score - a.score);
    const bestSplits = scoredSplits.slice(0, 2);

    const splitCandidates: JourneyCandidate[] = [];

    for (const { stop } of bestSplits) {
      const splitCode = stop.source_stn_code.toUpperCase();
      const splitName = stop.source_stn_name || splitCode;

      const leg1DepMin = toMinutes(t.from_time);
      const splitArrMin = toMinutes(stop.arrive || stop.depart);
      let leg1TravelMin = splitArrMin - leg1DepMin;
      if (leg1TravelMin < 0) leg1TravelMin += 1440;

      const leg2DepMin = toMinutes(stop.depart || stop.arrive);
      const leg2ArrMin = toMinutes(t.to_time);
      let leg2TravelMin = leg2ArrMin - leg2DepMin;
      if (leg2TravelMin < 0) leg2TravelMin += 1440;

      const formatHHMM = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };

      const leg1: Leg = {
        mode: "train",
        source: "live",
        trainNo: t.train_no,
        trainName: t.train_name,
        from: fromUpper,
        to: splitCode,
        departure: t.from_time,
        arrival: stop.arrive || stop.depart,
        travelTime: formatHHMM(leg1TravelMin),
        runningDays: t.running_days,
        depAbsMin: leg1DepMin,
        arrAbsMin: leg1DepMin + leg1TravelMin,
        bookingUrl: "https://www.irctc.co.in/nget/train-search",
        isSameTrainSplit: true,
      };

      const leg2: Leg = {
        mode: "train",
        source: "live",
        trainNo: t.train_no,
        trainName: t.train_name,
        from: splitCode,
        to: toUpper,
        departure: stop.depart || stop.arrive,
        arrival: t.to_time,
        travelTime: formatHHMM(leg2TravelMin),
        runningDays: t.running_days,
        depAbsMin: leg1.arrAbsMin, // On the same train, zero transfer time!
        arrAbsMin: leg1.arrAbsMin + leg2TravelMin,
        bookingUrl: "https://www.irctc.co.in/nget/train-search",
        isSameTrainSplit: true,
      };

      splitCandidates.push({
        legs: [leg1, leg2],
        hub: splitCode,
        hubSource: "route-topology",
        extensionType: "same_train_split",
      });
    }

    return splitCandidates;
  });

  const splitResults = await Promise.all(splitPromises);
  for (const list of splitResults) {
    for (const item of list) {
      candidates.push(item);
    }
  }

  return candidates;
}

