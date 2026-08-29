import { getOrCreatePlace } from "../places/repository";
import { getHubCandidates, DiscoverOptions, GraphDiscoveryResult, PartialCoverage } from "../graph/discover";
import { ScoredHub } from "../graph/hubs";
import { ALL_MODES } from "../transport/registry";
import { multimodalGraphSearch } from "./graphSearch";
import { trainMultiHopSearch } from "../transport/train";
import type { SearchFilters } from "./filters";
import { DEFAULT_TRANSFER_BUFFER_MIN } from "./filters";
import type { JourneyCandidate, Mode } from "../graph/types";

export interface MultimodalDiscoveryResult extends GraphDiscoveryResult {
  modesAvailable: Mode[];
  candidatesByMode: Partial<Record<Mode, number>>;
}

/**
 * `JourneySearchEngine` / `searchService.ts` from the architecture doc —
 * this is now the ONE journey search pipeline (lib/graph/discoverMultimodal.ts,
 * which used to hold this responsibility, has been removed — see the
 * migration report). Flow, matching the doc's Part 43 exactly:
 *
 *   resolve origin/destination -> canonical Place
 *     -> train's own multi-hop engine (reused, unchanged — see lib/transport/train.ts)
 *     -> generic bounded Place-graph search for everything else (lib/journey/graphSearch.ts)
 *     -> merge into the existing JourneyCandidate[] result shape
 *
 * The return shape is unchanged from the pre-refactor MultimodalDiscoveryResult
 * specifically so lib/searchJourney.ts, every API route, and the entire
 * frontend keep working with zero changes — per the doc's explicit
 * backward-compatibility requirement (Part 49/56): the internal engine
 * changed completely, the public contract didn't.
 */
export async function searchJourneyPlaceFirst(
  fromQuery: string,
  toQuery: string,
  opts: DiscoverOptions & { modes?: Mode[] }
): Promise<MultimodalDiscoveryResult> {
  const requestedModes = opts.modes ?? ALL_MODES;
  const hasTrain = requestedModes.includes("train");
  const nonTrainModes = requestedModes.filter(mode => mode !== "train");

  const [origin, destination] = await Promise.all([getOrCreatePlace(fromQuery), getOrCreatePlace(toQuery)]);

  const modeCounts: Partial<Record<Mode, number>> = {};
  const bump = (mode: Mode, by: number) => {
    if (by > 0) modeCounts[mode] = (modeCounts[mode] ?? 0) + by;
  };

  // Initialize result arrays
  const direct: JourneyCandidate[] = [];
  const viaHub: JourneyCandidate[] = [];
  const viaTwoHub: JourneyCandidate[] = [];
  const viaThreeHub: JourneyCandidate[] = [];
  let hubsExplored: { code: string; name: string; relevance: number; source: string }[] = [];
  let partial: PartialCoverage[] = [];

  if (origin && destination) {
    // --- Train's own multi-hop engine (if train is requested) ---
    if (hasTrain) {
      const trainOpts: DiscoverOptions = {
        date: opts.date,
        maxHubs: opts.maxHubs,
        transferBufferMin: opts.transferBufferMin,
        maxTransferMin: opts.maxTransferMin,
        maxConnections: opts.maxConnections,
        forceTwoHub: opts.forceTwoHub,
      };

      const trainResult = await trainMultiHopSearch(origin, destination, trainOpts);
      if (trainResult) {
        // Merge train results
        direct.push(...trainResult.direct);
        viaHub.push(...trainResult.viaHub);
        viaTwoHub.push(...trainResult.viaTwoHub);
        viaThreeHub.push(...trainResult.viaThreeHub);
        partial.push(...trainResult.partial);

        // Count modes from train results
        for (const leg of [...trainResult.direct, ...trainResult.viaHub, ...trainResult.viaTwoHub, ...trainResult.viaThreeHub].flatMap(c => c.legs)) {
          bump(leg.mode, 1);
        }

        // For graph debug view - include train's hub exploration
        hubsExplored = [...hubsExplored, ...trainResult.graph.hubsExplored.map(h => ({
          code: h.code,
          name: h.name,
          relevance: h.relevance,
          source: h.source
        }))];
      }
    }

    // --- Generic bounded Place-graph search for non-train modes and cross-mode chains ---
    // We always run the generic search to catch cross-mode journeys (e.g., bus->train, train->bus)
    // and to handle non-train modes
    const genericFilters: SearchFilters = {
      modes: requestedModes, // Include all modes to allow cross-mode chains
      maxConnections: opts.maxConnections ?? 2,
      transferBufferMin: opts.transferBufferMin ?? DEFAULT_TRANSFER_BUFFER_MIN,
    };

    const genericPaths = await multimodalGraphSearch(origin, destination, opts.date, genericFilters);

    for (const path of genericPaths) {
      // Count modes for modesAvailable and candidatesByMode
      for (const leg of path.legs) {
        bump(leg.mode, 1);
      }

      if (path.legs.length === 1) {
        direct.push({ legs: path.legs });
      } else if (path.legs.length === 2) {
        viaHub.push({ legs: path.legs, hub: path.legs[0].to, hubSource: "static" });
      } else if (path.legs.length === 3) {
        viaTwoHub.push({ legs: path.legs, hub: path.legs[0].to, hub2: path.legs[1].to, hubSource: "static" });
      } else if (path.legs.length === 4) {
        viaThreeHub.push({ legs: path.legs, hub: path.legs[0].to, hub2: path.legs[1].to, hub3: path.legs[2].to, hubSource: "static" });
      }
    }

    // For the graph debug view (GraphStats) — the candidate places this search
    // actually considered, regardless of whether they produced a usable edge.
    // Get hub candidates using station codes if available, otherwise use empty array for debug view.
    let genericHubs: ScoredHub[] = [];
    if (origin.railway?.stations?.length && destination.railway?.stations?.length) {
      // Use the first station from each place for hub candidate generation
      genericHubs = await getHubCandidates(
        origin.railway.stations[0].code,
        destination.railway.stations[0].code,
        5
      );
    }
    const genericHubsExplored = genericHubs.map((h) => ({ code: h.code, name: h.name, relevance: h.relevance, source: "static/live" }));

    // Merge generic hubs explored (avoiding duplicates)
    const genericHubCodes = new Set(genericHubsExplored.map(h => h.code));
    hubsExplored = [...hubsExplored, ...genericHubsExplored.filter(h => !genericHubCodes.has(h.code))];
  }

  // Deduplicate results to avoid combining train and generic results for the same journeys
  // We'll do a simple deduplication based on leg sequences
  const allDirect = dedupeJourneyCandidates(direct);
  const allViaHub = dedupeJourneyCandidates(viaHub);
  const allViaTwoHub = dedupeJourneyCandidates(viaTwoHub);
  const allViaThreeHub = dedupeJourneyCandidates(viaThreeHub);

  const modesAvailable: Mode[] = requestedModes.filter((m) => {
    // For all modes, check if we got any candidates for this mode
    return (modeCounts[m] ?? 0) > 0;
  });

  const graph = {
    nodesDiscovered: hubsExplored.length + 2,
    edgesDiscovered: [...allDirect, ...allViaHub, ...allViaTwoHub, ...allViaThreeHub].reduce((n, c) => n + c.legs.length, 0),
    layers: allViaThreeHub.length > 0 ? 4 : allViaTwoHub.length > 0 ? 3 : allViaHub.length > 0 ? 2 : 1,
    hubsExplored,
    dynamicHubsUsed: false, // TODO: Implement dynamic hubs detection
    twoHubUsed: allViaTwoHub.length > 0,
    threeHubUsed: allViaThreeHub.length > 0,
  };

  return {
    direct: allDirect,
    viaHub: allViaHub,
    viaTwoHub: allViaTwoHub,
    viaThreeHub: allViaThreeHub,
    partial,
    graph,
    suggestion: null, // TODO: Implement suggestions
    modesAvailable,
    candidatesByMode: modeCounts,
  };
}

// Helper function to deduplicate journey candidates based on their leg sequences
function dedupeJourneyCandidates(candidates: JourneyCandidate[]): JourneyCandidate[] {
  const seen = new Set<string>();
  const result: JourneyCandidate[] = [];

  for (const candidate of candidates) {
    // Create a unique key based on the sequence of legs
    const key = candidate.legs.map(leg =>
      `${leg.mode}:${leg.trainNo || 'unknown'}:${leg.from}:${leg.to}:${leg.departure}:${leg.arrival}`
    ).join('|');

    if (!seen.has(key)) {
      seen.add(key);
      result.push(candidate);
    }
  }

  return result;
}

function tagLegs(c: JourneyCandidate, mode: Mode): JourneyCandidate {
  return { ...c, legs: c.legs.map((l) => ({ ...l, mode, source: l.source ?? "live" })) };
}

function emptyGraphResult(): GraphDiscoveryResult {
  return {
    direct: [],
    viaHub: [],
    viaTwoHub: [],
    viaThreeHub: [],
    partial: [],
    graph: { nodesDiscovered: 0, edgesDiscovered: 0, layers: 1, hubsExplored: [], dynamicHubsUsed: false, twoHubUsed: false, threeHubUsed: false },
    suggestion: null,
  };
}
