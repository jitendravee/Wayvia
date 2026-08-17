import { getTrainsOnDate } from "../erail/client";
import type { BetweenStationEntry } from "../erail/prettify";
import { rankedCandidateHubs, ScoredHub } from "./hubs";
import type { Leg, JourneyCandidate } from "./types";

/**
 * erail.in's own timetable data doesn't come as a bulk download the way a
 * government dataset would — so instead of pre-building a master graph
 * table, this layer queries erail.in's betweenStations endpoint live, on
 * demand, for each (origin, hub) / (hub, destination) pair. The "master
 * network" here is effectively erail.in itself, browsed one query at a time.
 *
 * ARCHITECTURE: this is a route-graph engine, not a "direct-first, fall
 * back to hubs if thin" engine. Direct trains are just the zero-transfer
 * layer of the graph — the hub layer is *always* explored alongside it,
 * regardless of how many direct trains exist, because a cheaper or more
 * reliable journey can exist even when a fine direct train does too. The
 * decision about which to actually show someone belongs to scoring/ranking
 * downstream (lib/score.ts), never to structural discovery.
 */

/** 'HH:MM' or 'HH.MM' -> minutes since midnight. */
function toMinutes(time: string): number {
  const norm = time.replace(".", ":");
  const [h, m] = norm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function entryToLeg(entry: BetweenStationEntry): Omit<Leg, "depAbsMin" | "arrAbsMin"> {
  const t = entry.train_base;
  return {
    trainNo: t.train_no,
    trainName: t.train_name,
    from: t.from_stn_code,
    to: t.to_stn_code,
    departure: t.from_time,
    arrival: t.to_time,
    travelTime: t.travel_time,
    runningDays: t.running_days,
  };
}

/** Attaches absolute minute offsets to a leg, assuming it departs on `dayOffset` (0 = search date). */
function withAbsoluteTimes(leg: Omit<Leg, "depAbsMin" | "arrAbsMin">, dayOffset: number): Leg {
  const depMin = toMinutes(leg.departure);
  const travelMin = toMinutes(leg.travelTime);
  const depAbsMin = dayOffset * 1440 + depMin;
  const arrAbsMin = depAbsMin + travelMin;
  return { ...leg, depAbsMin, arrAbsMin };
}

export interface DiscoverOptions {
  date: string; // 'YYYY-MM-DD'
  maxHubs?: number;
  /** Minimum minutes required between arrival and the next departure when changing trains. */
  transferBufferMin?: number;
  /** Maximum layover between legs before a connection is considered impractical. */
  maxTransferMin?: number;
}

function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/** Direct trains between two stations, running on the given date. */
export async function directSearch(from: string, to: string, opts: DiscoverOptions): Promise<JourneyCandidate[]> {
  const date = isoToDDMMYYYY(opts.date);
  const result = await getTrainsOnDate(from, to, date);
  if (!result.success) return [];
  const entries = result.data as BetweenStationEntry[];
  return entries.map((e) => ({ legs: [withAbsoluteTimes(entryToLeg(e), 0)] }));
}

/**
 * Constructs 1-connection alternates by fanning out to relevance-scored
 * hub stations and checking whether the two legs actually connect in time.
 *
 * KNOWN SIMPLIFICATION: both legs are assumed to run on the same calendar
 * date's running-day pattern (i.e. if the connecting leg would actually
 * depart the next day, we don't re-check its running_days against the
 * shifted date). Fine for same-day connections; flag this if you extend
 * to journeys where the transfer crosses midnight and the connecting train
 * doesn't run every day.
 */
export async function hubSearch(
  from: string,
  to: string,
  opts: DiscoverOptions
): Promise<{ candidates: JourneyCandidate[]; hubsExplored: ScoredHub[] }> {
  const date = isoToDDMMYYYY(opts.date);
  const hubs = rankedCandidateHubs(from, to, opts.maxHubs ?? 10);
  const buffer = opts.transferBufferMin ?? 45;
  const maxTransfer = opts.maxTransferMin ?? 8 * 60;

  const legPairs = await Promise.all(
    hubs.map(async (hub) => {
      const [leg1Result, leg2Result] = await Promise.all([
        getTrainsOnDate(from, hub.code, date),
        getTrainsOnDate(hub.code, to, date),
      ]);
      const leg1s = leg1Result.success ? (leg1Result.data as BetweenStationEntry[]) : [];
      const leg2s = leg2Result.success ? (leg2Result.data as BetweenStationEntry[]) : [];
      return { hub, leg1s, leg2s };
    })
  );

  const candidates: JourneyCandidate[] = [];

  for (const { hub, leg1s, leg2s } of legPairs) {
    for (const e1 of leg1s) {
      const leg1 = withAbsoluteTimes(entryToLeg(e1), 0);
      for (const e2 of leg2s) {
        const rawLeg2 = entryToLeg(e2);

        // Try same-day departure first, then next-day if that doesn't clear the buffer.
        let leg2 = withAbsoluteTimes(rawLeg2, 0);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) {
          leg2 = withAbsoluteTimes(rawLeg2, 1);
        }
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) continue; // still infeasible even next day, skip

        // Cap absurd waits to keep results sensible.
        if (leg2.depAbsMin - leg1.arrAbsMin > maxTransfer) continue;

        candidates.push({ legs: [leg1, leg2], hub: hub.code });
      }
    }
  }

  return { candidates, hubsExplored: hubs };
}

/** De-dupes candidates that share the exact same train-number sequence. */
function dedupe(candidates: JourneyCandidate[]): JourneyCandidate[] {
  const seen = new Set<string>();
  const out: JourneyCandidate[] = [];
  for (const c of candidates) {
    const key = c.legs.map((l) => `${l.trainNo}:${l.depAbsMin}`).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export interface GraphDiscoveryResult {
  direct: JourneyCandidate[];
  viaHub: JourneyCandidate[];
  graph: {
    nodesDiscovered: number; // hub stations actually explored, + origin + destination
    edgesDiscovered: number; // total legs across every candidate found
    layers: number; // 1 = direct only reachable, 2 = one-hub connections included
    hubsExplored: { code: string; name: string; relevance: number }[];
  };
}

/**
 * Runs direct search AND hub-graph expansion together, every time.
 * Availability never gates structural discovery — the graph is built
 * first, regardless of how many direct trains exist, and only afterwards
 * do we check seats/fare and rank everything (see lib/availability.ts and
 * lib/score.ts). This is the core change from the old
 * "if (directCount < threshold) tryHubs()" fallback model.
 */
export async function discoverJourneys(
  from: string,
  to: string,
  opts: DiscoverOptions
): Promise<GraphDiscoveryResult> {
  const [direct, hubResult] = await Promise.all([
    directSearch(from, to, opts),
    hubSearch(from, to, opts),
  ]);

  const viaHub = dedupe(hubResult.candidates);
  const edgesDiscovered = direct.reduce((n, c) => n + c.legs.length, 0) + viaHub.reduce((n, c) => n + c.legs.length, 0);

  return {
    direct,
    viaHub,
    graph: {
      nodesDiscovered: hubResult.hubsExplored.length + 2,
      edgesDiscovered,
      layers: viaHub.length > 0 ? 2 : 1,
      hubsExplored: hubResult.hubsExplored.map((h) => ({ code: h.code, name: h.name, relevance: Math.round(h.relevance * 100) / 100 })),
    },
  };
}
