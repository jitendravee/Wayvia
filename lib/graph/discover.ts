import { getTrainsOnDate } from "../erail/client";
import type { BetweenStationEntry } from "../erail/prettify";
import { getLiveStations, getDiscoveredStations } from "../erail/stationDirectory";
import { rankedCandidateHubs, ScoredHub, Hub, DEFAULT_HUBS, GeoPoint } from "./hubs";
import { discoverHubsFromRoutes, RouteDerivedHub } from "./dynamicHubs";
import type { Leg, JourneyCandidate, PartialCoverage } from "./types";

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
 *
 * TIERS, cheapest to most expensive:
 *   1. direct              — betweenStations(from, to) directly.
 *   2. hub (1 change)      — betweenStations(from, hub) + (hub, to), hub
 *                            pool = static geo list ∪ live station
 *                            directory ∪ anything this process has
 *                            discovered so far.
 *   3. two-hub (2 changes) — only attempted when tier 1+2 came up thin
 *                            (see THIN_RESULTS_THRESHOLD below); it's
 *                            O(K²) betweenStations calls so it's gated
 *                            rather than run unconditionally.
 *   4. dynamic hubs        — also only when tiers 1+2 came up thin: reads
 *                            the *real* stop list of a few trains that do
 *                            leave `from` (via getRoute) and retries tier 2
 *                            against those real stops instead of
 *                            geo-guessed ones.
 *
 * Tiers 3 and 4 are the "escalate when the cheap tiers didn't find enough"
 * exception to the "always explore everything" principle above — justified
 * purely by API-call cost (each is several more erail.in round trips), not
 * by a belief that direct trains are "good enough". They run alongside
 * each other, not one gated behind the other succeeding.
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
    mode: "train",
    source: "live",
    trainNo: t.train_no,
    trainName: t.train_name,
    from: t.from_stn_code,
    to: t.to_stn_code,
    departure: t.from_time,
    bookingUrl:"https://www.irctc.co.in/nget/train-search",
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
  /**
   * How many via-junctions the caller is willing to have searched, 1-3
   * (this is the "junctions" slider on the search form — the user decides
   * how deep to go based on how much time/patience they have):
   *   1 = direct + single-junction (1 change) only.
   *   2 = also search 2-junction (2 change) chains.
   *   3 = also search 3-junction (3 change) chains — the most expensive tier,
   *       only ever run when explicitly requested via this option.
   * Regardless of this ceiling, when the cheap tiers come up thin the next
   * tier up is still peeked at (see THIN_RESULTS_THRESHOLD) so a search
   * never silently misses a route just because the slider was left low —
   * that peek is surfaced back as `suggestion`, not folded into results.
   */
  maxConnections?: 1 | 2 | 3;
  /** @deprecated use maxConnections >= 2 instead. Kept for backward compatibility. */
  forceTwoHub?: boolean;
  /**
   * The resolved origin/destination Place's real lat/lon (e.g. from
   * GeoNames), when the caller has one. `from`/`to` throughout this file
   * are bare station codes, which only carry coordinates if they happen
   * to be one of the ~100 curated DEFAULT_HUBS junctions — passing the
   * Place's actual coordinates here means hub-relevance scoring
   * (lib/graph/hubs.ts's scoreHub) still works geographically for a small
   * station that isn't a "hub" itself, instead of silently falling back
   * to a neutral 0.5 for every candidate. See lib/transport/train.ts's
   * trainMultiHopSearch, the only caller that currently sets these.
   */
  originCoords?: GeoPoint | null;
  destCoords?: GeoPoint | null;
}

function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/** Below this many combined direct + 1-hub candidates, the expensive tiers (2-hub, dynamic-route hubs) kick in. */
const THIN_RESULTS_THRESHOLD = 3;

/** Direct trains between two stations, running on the given date. */
export async function directSearch(from: string, to: string, opts: DiscoverOptions): Promise<JourneyCandidate[]> {
  const date = isoToDDMMYYYY(opts.date);
  const result = await getTrainsOnDate(from, to, date);
  if (!result.success) return [];
  const entries = result.data as BetweenStationEntry[];
  return entries.map((e) => ({ legs: [withAbsoluteTimes(entryToLeg(e), 0)] }));
}

/**
 * Builds a merged hub pool: the static geo list, plus every station the
 * live erail.in directory and this process's own discoveries know about.
 * Live/discovered entries have no coordinates, so they're capped separately
 * (liveCap) to keep the O(hubs) betweenStations fan-out bounded even when
 * the live directory has grown large — the caller's `maxHubs` (from the FE
 * slider) still governs how many actually get queried after scoring.
 */
async function buildHubPool(liveCap = 150): Promise<Hub[]> {
  const pool: Hub[] = [...DEFAULT_HUBS];
  const seen = new Set(pool.map((h) => h.code));

  let live: { code: string; name: string }[] = [];
  try {
    live = await getLiveStations();
  } catch {
    live = [];
  }
  for (const s of live.slice(0, liveCap)) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    pool.push({ code: s.code, name: s.name, lat: 0, lon: 0 });
  }

  for (const s of getDiscoveredStations()) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    pool.push({ code: s.code, name: s.name, lat: 0, lon: 0 });
  }

  return pool;
}

interface HubLegPairResult {
  hub: ScoredHub;
  leg1s: BetweenStationEntry[];
  leg2s: BetweenStationEntry[];
}

/** Fetches from->hub and hub->to candidates for a batch of hubs, in parallel. */
async function fetchHubLegPairs(from: string, to: string, hubs: ScoredHub[], date: string): Promise<HubLegPairResult[]> {
  return Promise.all(
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
}

/** Builds feasible 1-connection candidates from already-fetched leg pairs, respecting transfer buffer/cap. */
function connectLegPairs(
  legPairs: HubLegPairResult[],
  buffer: number,
  maxTransfer: number,
  hubSource: JourneyCandidate["hubSource"]
): JourneyCandidate[] {
  const candidates: JourneyCandidate[] = [];
  for (const { hub, leg1s, leg2s } of legPairs) {
    for (const e1 of leg1s) {
      const leg1 = withAbsoluteTimes(entryToLeg(e1), 0);
      for (const e2 of leg2s) {
        const rawLeg2 = entryToLeg(e2);
        let leg2 = withAbsoluteTimes(rawLeg2, 0);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) {
          leg2 = withAbsoluteTimes(rawLeg2, 1);
        }
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) continue;
        if (leg2.depAbsMin - leg1.arrAbsMin > maxTransfer) continue;
        candidates.push({ legs: [leg1, leg2], hub: hub.code, hubSource });
      }
    }
  }
  return candidates;
}

export interface HubSearchResult {
  candidates: JourneyCandidate[];
  hubsExplored: ScoredHub[];
  legPairs: HubLegPairResult[];
}

/**
 * Constructs 1-connection alternates by fanning out to relevance-scored
 * hub stations (static geo list + live directory, merged) and checking
 * whether the two legs actually connect in time.
 *
 * KNOWN SIMPLIFICATION: both legs are assumed to run on the same calendar
 * date's running-day pattern (i.e. if the connecting leg would actually
 * depart the next day, we don't re-check its running_days against the
 * shifted date). Fine for same-day connections; flag this if you extend
 * to journeys where the transfer crosses midnight and the connecting train
 * doesn't run every day.
 */
export async function hubSearch(from: string, to: string, opts: DiscoverOptions): Promise<HubSearchResult> {
  const date = isoToDDMMYYYY(opts.date);
  const buffer = opts.transferBufferMin ?? 45;
  const maxTransfer = opts.maxTransferMin ?? 8 * 60;

  const pool = await buildHubPool();
  const hubs = rankedCandidateHubs(from, to, opts.maxHubs ?? 10, pool, opts.originCoords, opts.destCoords);
  const legPairs = await fetchHubLegPairs(from, to, hubs, date);
  const candidates = connectLegPairs(legPairs, buffer, maxTransfer, "static");

  return { candidates, hubsExplored: hubs, legPairs };
}

/**
 * The same relevance-scored hub pool `hubSearch` fans out to (static geo
 * list ∪ live erail directory ∪ this process's own discoveries) — but
 * without actually querying erail for anything. These are "candidate
 * places worth transferring through", a purely geographic/topological
 * notion, not a train-specific one. lib/places/graph.ts and lib/journey/graphSearch.ts use
 * this so a bus-only (or bus+flight, no train) search still gets a
 * sensible hub list to route indirect journeys through, instead of being
 * forced to piggyback on the train engine's own hub search just to find
 * out which junctions exist.
 */
export async function getHubCandidates(
  from: string,
  to: string,
  maxHubs = 10,
  originCoords?: GeoPoint | null,
  destCoords?: GeoPoint | null
): Promise<ScoredHub[]> {
  const pool = await buildHubPool();
  return rankedCandidateHubs(from, to, maxHubs, pool, originCoords, destCoords);
}

/**
 * Tier 4: reads real routes of a few trains that leave `from` (seeded from
 * whatever hubSearch already found departing `from`, even if those
 * particular legs didn't connect through to `to`) and retries the hub
 * search against those real intermediate stops.
 */
async function dynamicHubSearch(
  from: string,
  to: string,
  seedTrainNos: string[],
  opts: DiscoverOptions
): Promise<{ candidates: JourneyCandidate[]; hubsExplored: RouteDerivedHub[] }> {
  const date = isoToDDMMYYYY(opts.date);
  const buffer = opts.transferBufferMin ?? 45;
  const maxTransfer = opts.maxTransferMin ?? 8 * 60;

  const dynamicHubs = await discoverHubsFromRoutes(from, to, seedTrainNos, { maxSeedTrains: 5, maxStopsPerTrain: 8 });
  if (dynamicHubs.length === 0) return { candidates: [], hubsExplored: [] };

  const capped = dynamicHubs.slice(0, opts.maxHubs ?? 10);
  const legPairs = await fetchHubLegPairs(from, to, capped, date);
  const candidates = connectLegPairs(legPairs, buffer, maxTransfer, "route-topology");

  return { candidates, hubsExplored: capped };
}

/**
 * Tier 3: 2-connection (3-leg) chains through a pair of hubs — from -> hubA
 * -> hubB -> to. Only ever called on a thin result set; K is kept small
 * (default 6) because this tier costs on the order of K² extra
 * betweenStations calls for the middle hop alone.
 */
export async function twoHubSearch(
  from: string,
  to: string,
  hubs: ScoredHub[],
  opts: DiscoverOptions,
  maxPairs = 6
): Promise<JourneyCandidate[]> {
  const date = isoToDDMMYYYY(opts.date);
  const buffer = opts.transferBufferMin ?? 45;
  const maxTransfer = opts.maxTransferMin ?? 8 * 60;
  const top = hubs.slice(0, maxPairs);
  if (top.length < 2) return [];

  // from -> hubA and hubB -> to, reusing the same shape as the 1-hub tier.
  const legPairs = await fetchHubLegPairs(from, to, top, date);
  const leg1ByHub = new Map(legPairs.map((p) => [p.hub.code, p.leg1s]));
  const leg3ByHub = new Map(legPairs.map((p) => [p.hub.code, p.leg2s]));

  // Middle hop hubA -> hubB, only for hubs that actually have a usable leg1 and a downstream hub with a usable leg3.
  const pairs: { a: ScoredHub; b: ScoredHub }[] = [];
  for (const a of top) {
    if (!(leg1ByHub.get(a.code) ?? []).length) continue;
    for (const b of top) {
      if (a.code === b.code) continue;
      if (!(leg3ByHub.get(b.code) ?? []).length) continue;
      pairs.push({ a, b });
    }
  }

  const middleLegs = await Promise.all(
    pairs.map(async ({ a, b }) => {
      const result = await getTrainsOnDate(a.code, b.code, date);
      const entries = result.success ? (result.data as BetweenStationEntry[]) : [];
      return { a, b, entries };
    })
  );

  const candidates: JourneyCandidate[] = [];
  for (const { a, b, entries } of middleLegs) {
    if (entries.length === 0) continue;
    const leg1s = leg1ByHub.get(a.code) ?? [];
    const leg3s = leg3ByHub.get(b.code) ?? [];

    for (const e1 of leg1s) {
      const leg1 = withAbsoluteTimes(entryToLeg(e1), 0);
      for (const e2raw of entries) {
        let leg2 = withAbsoluteTimes(entryToLeg(e2raw), 0);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) leg2 = withAbsoluteTimes(entryToLeg(e2raw), 1);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) continue;
        if (leg2.depAbsMin - leg1.arrAbsMin > maxTransfer) continue;

        for (const e3raw of leg3s) {
          let leg3 = withAbsoluteTimes(entryToLeg(e3raw), Math.floor(leg2.arrAbsMin / 1440));
          if (leg3.depAbsMin < leg2.arrAbsMin + buffer) {
            leg3 = withAbsoluteTimes(entryToLeg(e3raw), Math.floor(leg2.arrAbsMin / 1440) + 1);
          }
          if (leg3.depAbsMin < leg2.arrAbsMin + buffer) continue;
          if (leg3.depAbsMin - leg2.arrAbsMin > maxTransfer) continue;

          candidates.push({ legs: [leg1, leg2, leg3], hub: a.code, hub2: b.code, hubSource: "static" });
        }
      }
    }
  }

  return candidates;
}

/**
 * Tier 5: 3-connection (4-leg) chains through three hubs — from -> hubA ->
 * hubB -> hubC -> to. This is the deepest, priciest tier (roughly K³
 * betweenStations calls for the two middle hops), so the hub pool per hop
 * is kept small (default 4) and it is ONLY ever run when the caller
 * explicitly asks for it via `maxConnections: 3` (the "junctions" slider
 * set all the way up) — never auto-triggered by thin results the way tier
 * 2 -> 3 escalation is, to keep an ordinary search fast.
 */
export async function threeHubSearch(
  from: string,
  to: string,
  hubs: ScoredHub[],
  opts: DiscoverOptions,
  maxPerHop = 4
): Promise<JourneyCandidate[]> {
  const date = isoToDDMMYYYY(opts.date);
  const buffer = opts.transferBufferMin ?? 45;
  const maxTransfer = opts.maxTransferMin ?? 8 * 60;
  const top = hubs.slice(0, maxPerHop);
  if (top.length < 3) return [];

  // from -> hubA and hubC -> to, reusing the same shape as the 1-hub tier.
  const legPairs = await fetchHubLegPairs(from, to, top, date);
  const leg1ByHub = new Map(legPairs.map((p) => [p.hub.code, p.leg1s]));
  const leg4ByHub = new Map(legPairs.map((p) => [p.hub.code, p.leg2s]));

  // First middle hop: hubA -> hubB, only for hubs with a usable leg1.
  const abPairs = top.filter((a) => (leg1ByHub.get(a.code) ?? []).length > 0);
  if (abPairs.length === 0) return [];

  const abMiddle = await Promise.all(
    abPairs.flatMap((a) =>
      top
        .filter((b) => b.code !== a.code)
        .map(async (b) => {
          const result = await getTrainsOnDate(a.code, b.code, date);
          const entries = result.success ? (result.data as BetweenStationEntry[]) : [];
          return { a, b, entries };
        })
    )
  );

  // Second middle hop: hubB -> hubC, only for hubs with a usable leg4 (hubC -> to)
  // and only where the first middle hop actually produced something to build on.
  const bWithLeg1s = new Set(abMiddle.filter((m) => m.entries.length > 0).map((m) => m.b.code));
  const bcPairs = top.filter((b) => bWithLeg1s.has(b.code));
  const cCandidates = top.filter((c) => (leg4ByHub.get(c.code) ?? []).length > 0);

  const bcMiddle = await Promise.all(
    bcPairs.flatMap((b) =>
      cCandidates
        .filter((c) => c.code !== b.code)
        .map(async (c) => {
          const result = await getTrainsOnDate(b.code, c.code, date);
          const entries = result.success ? (result.data as BetweenStationEntry[]) : [];
          return { b, c, entries };
        })
    )
  );
  const bcByB = new Map<string, { c: ScoredHub; entries: BetweenStationEntry[] }[]>();
  for (const { b, c, entries } of bcMiddle) {
    if (entries.length === 0) continue;
    if (!bcByB.has(b.code)) bcByB.set(b.code, []);
    bcByB.get(b.code)!.push({ c, entries });
  }

  const candidates: JourneyCandidate[] = [];
  for (const { a, b, entries: abEntries } of abMiddle) {
    if (abEntries.length === 0) continue;
    const leg1s = leg1ByHub.get(a.code) ?? [];
    const bcOptions = bcByB.get(b.code) ?? [];
    if (bcOptions.length === 0) continue;

    for (const e1 of leg1s) {
      const leg1 = withAbsoluteTimes(entryToLeg(e1), 0);
      for (const e2raw of abEntries) {
        let leg2 = withAbsoluteTimes(entryToLeg(e2raw), 0);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) leg2 = withAbsoluteTimes(entryToLeg(e2raw), 1);
        if (leg2.depAbsMin < leg1.arrAbsMin + buffer) continue;
        if (leg2.depAbsMin - leg1.arrAbsMin > maxTransfer) continue;

        for (const { c, entries: bcEntries } of bcOptions) {
          const leg4s = leg4ByHub.get(c.code) ?? [];
          if (leg4s.length === 0) continue;

          for (const e3raw of bcEntries) {
            let leg3 = withAbsoluteTimes(entryToLeg(e3raw), Math.floor(leg2.arrAbsMin / 1440));
            if (leg3.depAbsMin < leg2.arrAbsMin + buffer) {
              leg3 = withAbsoluteTimes(entryToLeg(e3raw), Math.floor(leg2.arrAbsMin / 1440) + 1);
            }
            if (leg3.depAbsMin < leg2.arrAbsMin + buffer) continue;
            if (leg3.depAbsMin - leg2.arrAbsMin > maxTransfer) continue;

            for (const e4raw of leg4s) {
              let leg4 = withAbsoluteTimes(entryToLeg(e4raw), Math.floor(leg3.arrAbsMin / 1440));
              if (leg4.depAbsMin < leg3.arrAbsMin + buffer) {
                leg4 = withAbsoluteTimes(entryToLeg(e4raw), Math.floor(leg3.arrAbsMin / 1440) + 1);
              }
              if (leg4.depAbsMin < leg3.arrAbsMin + buffer) continue;
              if (leg4.depAbsMin - leg3.arrAbsMin > maxTransfer) continue;

              candidates.push({
                legs: [leg1, leg2, leg3, leg4],
                hub: a.code,
                hub2: b.code,
                hub3: c.code,
                hubSource: "static",
              });
              // Cap per (a,b,c) combo so one very well-served triple can't blow up the result set.
              if (candidates.length >= 200) return candidates;
            }
          }
        }
      }
    }
  }

  return candidates;
}

/**
 * Packages "we got partway there" results out of a hub search's raw
 * leg1/leg2 fetches — trains that genuinely run from the origin toward a
 * real junction, or from a real junction into the destination, even when
 * no matching leg on the other side let them form a full journey. Ranked
 * by hub relevance, deduped by (type, hub, trainNo), capped small since
 * this is a "did you know" supplement, not a primary result list.
 */
function buildPartialCoverage(legPairs: HubLegPairResult[], max = 5): PartialCoverage[] {
  const out: PartialCoverage[] = [];
  const seen = new Set<string>();

  const byRelevance = [...legPairs].sort((a, b) => b.hub.relevance - a.hub.relevance);

  for (const { hub, leg1s } of byRelevance) {
    if (leg1s.length === 0) continue;
    const e = leg1s[0];
    const key = `reaches_hub:${hub.code}:${e.train_base.train_no}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type: "reaches_hub",
      hub: hub.code,
      hubName: hub.name,
      leg: withAbsoluteTimes(entryToLeg(e), 0),
      note: `${e.train_base.train_name} (${e.train_base.train_no}) runs from your origin to ${hub.code}, a well-connected junction — no onward train to your destination matched this date, but it's worth searching ${hub.code} → destination directly.`,
    });
    if (out.length >= max) break;
  }

  for (const { hub, leg2s } of byRelevance) {
    if (out.length >= max * 2) break;
    if (leg2s.length === 0) continue;
    const e = leg2s[0];
    const key = `from_hub:${hub.code}:${e.train_base.train_no}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type: "from_hub",
      hub: hub.code,
      hubName: hub.name,
      leg: withAbsoluteTimes(entryToLeg(e), 0),
      note: `${e.train_base.train_name} (${e.train_base.train_no}) covers ${hub.code} → destination — if you can get to ${hub.code} some other way, this train completes the trip.`,
    });
  }

  return out.slice(0, max);
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

/** A next-tier "did you know" nudge, computed for free from data already fetched — no extra network calls. */
export interface ConnectionSuggestion {
  /** The junction depth (2 or 3) that looks worth trying. */
  nextConnections: 2 | 3;
  message: string;
}

export interface GraphDiscoveryResult {
  direct: JourneyCandidate[];
  viaHub: JourneyCandidate[];
  viaTwoHub: JourneyCandidate[];
  viaThreeHub: JourneyCandidate[];
  partial: PartialCoverage[];
  graph: {
    nodesDiscovered: number; // hub stations actually explored, + origin + destination
    edgesDiscovered: number; // total legs across every candidate found
    layers: number; // 1 = direct only, 2 = +1-hub, 3 = +2-hub, 4 = +3-hub / dynamic-route hubs
    hubsExplored: { code: string; name: string; relevance: number; source: string }[];
    dynamicHubsUsed: boolean;
    twoHubUsed: boolean;
    threeHubUsed: boolean;
  };
  /** Present only when results are thin and a deeper junction search wasn't run — a hint for the FE to offer bumping the slider. */
  suggestion: ConnectionSuggestion | null;
}

// Export PartialCoverage for use in other modules
export type { PartialCoverage };

/**
 * Runs direct search AND hub-graph expansion together, every time.
 * Availability never gates structural discovery — the graph is built
 * first, regardless of how many direct trains exist, and only afterwards
 * do we check seats/fare and rank everything (see lib/availability.ts and
 * lib/score.ts).
 *
 * Escalates to the expensive tiers (dynamic route-topology hubs, 2-hub
 * chains) only when the cheap tiers leave a thin result set — see
 * THIN_RESULTS_THRESHOLD — or when `opts.forceTwoHub` is set. Partial
 * coverage is always computed from whatever leg data was already fetched
 * (no extra requests) so it's essentially free.
 */
export async function discoverJourneys(from: string, to: string, opts: DiscoverOptions): Promise<GraphDiscoveryResult> {
  // maxConnections is the "junctions" slider value — how many via-junctions the
  // person opted into for this search. forceTwoHub is kept working as a legacy
  // alias (checkbox era) for anything still passing it.
  const maxConnections: 1 | 2 | 3 = opts.maxConnections ?? (opts.forceTwoHub ? 2 : 2);

  console.log(`[TRAIN discoverJourneys] START ${from} -> ${to} date=${opts.date} maxConnections=${maxConnections} maxHubs=${opts.maxHubs}`);

  const [direct, hubResult] = await Promise.all([directSearch(from, to, opts), hubSearch(from, to, opts)]);

  let viaHub = dedupe(hubResult.candidates);
  let viaTwoHub: JourneyCandidate[] = [];
  let viaThreeHub: JourneyCandidate[] = [];
  let dynamicHubsUsed = false;
  let twoHubUsed = false;
  let threeHubUsed = false;
  let extraHubsExplored: { code: string; name: string; relevance: number; source: string }[] = [];

  const thinAfterTier2 = direct.length + viaHub.length < THIN_RESULTS_THRESHOLD;
  // Tier 2 (2-junction) runs whenever the person's slider allows it, OR — regardless
  // of the slider — when the cheap tiers came up thin, so a search never silently
  // misses a route just because the slider was left low.
  const runTierTwo = maxConnections >= 2 || thinAfterTier2;

  if (runTierTwo) {
    // Seed dynamic-route discovery with real train numbers we already saw leaving `from`
    // (from hubSearch's leg1 fetches), so we're reading routes of trains we know exist.
    const seedTrainNos = hubResult.legPairs.flatMap((p) => p.leg1s.map((e) => e.train_base.train_no)).slice(0, 8);

    const [dynamicResult, twoHub] = await Promise.all([
      seedTrainNos.length > 0
        ? dynamicHubSearch(from, to, seedTrainNos, opts)
        : Promise.resolve({ candidates: [] as JourneyCandidate[], hubsExplored: [] as RouteDerivedHub[] }),
      twoHubSearch(from, to, hubResult.hubsExplored, opts, 6),
    ]);

    if (dynamicResult.candidates.length > 0) {
      dynamicHubsUsed = true;
      viaHub = dedupe([...viaHub, ...dynamicResult.candidates]);
      extraHubsExplored = dynamicResult.hubsExplored.map((h) => ({
        code: h.code,
        name: h.name,
        relevance: Math.round(h.relevance * 100) / 100,
        source: "route-topology",
      }));
    }
    if (twoHub.length > 0) {
      twoHubUsed = true;
      viaTwoHub = dedupe(twoHub);
    }
  }

  const thinAfterTier3 = direct.length + viaHub.length + viaTwoHub.length < THIN_RESULTS_THRESHOLD;
  // Tier 3 (3-junction) is the most expensive tier — it's ONLY run when the person
  // explicitly pushed the slider to 3. It is never auto-triggered by thin results,
  // unlike tier 2 above, to keep an ordinary search fast; thin results at this
  // point instead produce a `suggestion` below.
  if (maxConnections >= 3) {
    const threeHub = await threeHubSearch(from, to, hubResult.hubsExplored, opts, 4);
    if (threeHub.length > 0) {
      threeHubUsed = true;
      viaThreeHub = dedupe(threeHub);
    }
  }

  const totalFound = direct.length + viaHub.length + viaTwoHub.length + viaThreeHub.length;
  const partial = totalFound < THIN_RESULTS_THRESHOLD ? buildPartialCoverage(hubResult.legPairs) : [];

  // Cheap, no-extra-network-call heuristic: if the search is still thin and the
  // person hasn't already maxed out the slider, let them know the next tier is
  // worth trying. Tier 2's own thin-triggered run above means we usually already
  // know whether it helped; if it's still thin after that and maxConnections < 3,
  // 3-junction is the natural next suggestion. If maxConnections is already 1 and
  // tier 2 wasn't run at all for some reason, suggest 2 first.
  let suggestion: ConnectionSuggestion | null = null;
  if (totalFound < THIN_RESULTS_THRESHOLD) {
    if (maxConnections < 2) {
      suggestion = {
        nextConnections: 2,
        message: "Not much came back — try letting the search go through 2 junctions instead of 1.",
      };
    } else if (maxConnections < 3 && thinAfterTier3) {
      suggestion = {
        nextConnections: 3,
        message: "Still thin even via 2 junctions — a 3-junction search sometimes finds a route the shorter tiers miss (it takes longer, but it's there if you want it).",
      };
    }
  }

  const edgesDiscovered =
    direct.reduce((n, c) => n + c.legs.length, 0) +
    viaHub.reduce((n, c) => n + c.legs.length, 0) +
    viaTwoHub.reduce((n, c) => n + c.legs.length, 0) +
    viaThreeHub.reduce((n, c) => n + c.legs.length, 0);

  console.log(
    `[TRAIN discoverJourneys] DONE ${from} -> ${to}: direct=${direct.length} viaHub=${viaHub.length} ` +
      `viaTwoHub=${viaTwoHub.length} viaThreeHub=${viaThreeHub.length} (runTierTwo=${runTierTwo}, ` +
      `tier3Run=${maxConnections >= 3}, totalFound=${totalFound})`
  );

  return {
    direct,
    viaHub,
    viaTwoHub,
    viaThreeHub,
    partial,
    graph: {
      nodesDiscovered: hubResult.hubsExplored.length + extraHubsExplored.length + 2,
      edgesDiscovered,
      layers: viaThreeHub.length > 0 ? 4 : viaTwoHub.length > 0 ? 3 : viaHub.length > 0 ? 2 : 1,
      hubsExplored: [
        ...hubResult.hubsExplored.map((h) => ({ code: h.code, name: h.name, relevance: Math.round(h.relevance * 100) / 100, source: "static/live" })),
        ...extraHubsExplored,
      ],
      dynamicHubsUsed,
      twoHubUsed,
      threeHubUsed,
    },
    suggestion,
  };
}