import { searchJourneyPlaceFirst } from "@/lib/journey/searchService";
import { annotateWithAvailability, annotatePartialCoverage } from "@/lib/availability";
import { rankJourneys, buildNarrative } from "@/lib/score";
import { buildMapOverview } from "@/lib/mapOverview";
import type { Mode } from "@/lib/graph/types";
import type { SearchResponse } from "@/app/types";
import type { SortKey, ConnectionFilter, DepartureWindow, TransportFilter } from "@/app/components/filters";
import { applyFilters } from "@/app/components/filters";

export interface JourneySearchParams {
  from: string;
  to: string;
  date: string; // 'YYYY-MM-DD'
  travelClass: string;
  quota: string;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  page: number;
  pageSize: number;
  /** Which modes to search — defaults to every mode with a registered provider (train + whatever's in lib/providers/registry.ts). */
  modes?: Mode[];
  /** Filters to apply to results before pagination */
  sort?: SortKey;
  connections?: ConnectionFilter;
  confirmedOnly?: boolean;
  departure?: DepartureWindow;
  arrival?: DepartureWindow;
  maxFare?: number | null;
  maxDuration?: number | null;
  transport?: TransportFilter;
}

/**
 * Runs one point-to-point journey search end to end: multimodal structural
 * discovery (train's own hub graph, plus direct + hub-crossing bus/flight —
 * mode-agnostic in the sense that it doesn't care about class/quota),
 * availability + fare annotation (train hits erail live; other modes use
 * their own precomputed data), ranking, and pagination. This is the entire
 * body of a single /api/search call — pulled out so a multi-city itinerary
 * (A→B on date1, B→C on date2, ...) can reuse it leg by leg instead of the
 * multi-city route reimplementing any of it.
 */
export async function runJourneySearch(params: JourneySearchParams): Promise<SearchResponse> {
  const { from, to, date, travelClass, quota, maxHubs, maxConnections, page, pageSize, modes, sort, connections, confirmedOnly, departure, arrival, maxFare, maxDuration, transport } = params;

  const { direct, viaHub, viaTwoHub, viaThreeHub, partial, graph, suggestion, modesAvailable, candidatesByMode } = await searchJourneyPlaceFirst(from, to, {
    date,
    maxHubs,
    maxConnections,
    modes,
  });
  const allCandidates = [...direct, ...viaHub, ...viaTwoHub, ...viaThreeHub];

  if (allCandidates.length === 0) {
    const annotatedPartial = await annotatePartialCoverage(partial, date, travelClass, quota);
    const narrative = buildNarrative(null, 0, 0, 0, 0, annotatedPartial.length, 0, 0);

    // Determine the primary mode for the response when no candidates are found
    let primaryMode: Mode = "train"; // default fallback
    if (modes && modes.length > 0) {
      // Use the first requested mode if modes were specified
      primaryMode = modes[0];
    } else if (modesAvailable.length === 1) {
      // Single mode available - use that mode
      primaryMode = modesAvailable[0];
    } else if (modesAvailable.length > 1) {
      // Multiple modes available - use the mode with the most candidates
      let maxCount = 0;
      for (const mode of modesAvailable) {
        const count = candidatesByMode[mode] ?? 0;
        if (count > maxCount) {
          maxCount = count;
          primaryMode = mode;
        }
      }
    }

    return {
      from,
      to,
      date,
      travelClass,
      quota,
      mode: primaryMode,
      modesAvailable,
      candidatesByMode,
      graph,
      maxConnections,
      candidates: { direct: 0, oneConnection: 0, twoConnection: 0, threeConnection: 0 },
      narrative,
      suggestion,
      results: null,
      mapOverview: [],
      partial: annotatedPartial,
    };
  }

  const [annotated, annotatedPartial] = await Promise.all([
    annotateWithAvailability(allCandidates, date, travelClass, quota),
    annotatePartialCoverage(partial, date, travelClass, quota),
  ]);

  const availableOnly = annotated.filter((j) => j.fullyConfirmed);

  // Apply filters FIRST, then rank
  const frontendFilters = {
    sort: sort ?? "best",
    connections: connections ?? "any",
    confirmedOnly: confirmedOnly ?? false,
    departure: departure ?? "any",
    arrival: arrival ?? "any",
    maxFare: maxFare ?? null,
    maxDuration: maxDuration ?? null,
    transport: transport ?? "any",
  };
  const filteredJourneys = applyFilters(availableOnly, frontendFilters);
  const ranked = rankJourneys(filteredJourneys);

  // Compute counts from filtered results for the narrative
  const directCount = filteredJourneys.filter(j => j.connections === 0).length;
  const viaHubCount = filteredJourneys.filter(j => j.connections === 1).length;
  const structuralCount = availableOnly.length; // Structurally feasible before availability check
  const availableCount = filteredJourneys.length; // After filtering and ranking
  const partialCount = annotatedPartial.length;
  const viaTwoHubCount = filteredJourneys.filter(j => j.connections === 2).length;
  const viaThreeHubCount = filteredJourneys.filter(j => j.connections === 3).length;

  // Compute filtered modesAvailable and candidatesByMode for the response
  const filteredModeCounts: Record<Mode, number> = { train: 0, bus: 0, flight: 0 };
  for (const journey of filteredJourneys) {
    for (const leg of journey.legs) {
      const mode = leg.mode;
      filteredModeCounts[mode] = (filteredModeCounts[mode] ?? 0) + 1;
    }
  }
  // Remove zero counts
  const nonZeroFilteredModeCounts: Partial<Record<Mode, number>> = {};
  for (const mode in filteredModeCounts) {
    if (filteredModeCounts[mode as Mode] > 0) {
      nonZeroFilteredModeCounts[mode as Mode] = filteredModeCounts[mode as Mode];
    }
  }
  const filteredModesAvailable: Mode[] = Object.keys(nonZeroFilteredModeCounts)
    .map(mode => mode as Mode);
  const filteredCandidatesByMode: Partial<Record<Mode, number>> = {};
  for (const mode of filteredModesAvailable) {
    filteredCandidatesByMode[mode] = nonZeroFilteredModeCounts[mode];
  }

  const narrative = buildNarrative(
    ranked,
    directCount,
    viaHubCount,
    structuralCount,
    availableCount,
    partialCount,
    viaTwoHubCount,
    viaThreeHubCount
  );

  let pagedResults = ranked;
  let pagination = undefined;
  if (ranked) {
    const total = ranked.all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    pagedResults = { ...ranked, all: ranked.all.slice(start, start + pageSize) };
    pagination = { page: safePage, pageSize, total, totalPages };
  }

  // Determine the primary mode for the response based on filtered results
  let primaryMode: Mode = "train"; // default fallback
  if (filteredJourneys.length > 0) {
    // Count modes in the filtered results to determine the most common one
    const modeCounts: Record<Mode, number> = { train: 0, bus: 0, flight: 0 };
    for (const journey of filteredJourneys) {
      for (const leg of journey.legs) {
        const mode = leg.mode;
        modeCounts[mode] = (modeCounts[mode] ?? 0) + 1;
      }
    }

    // Find the mode with the highest count
    let maxCount = 0;
    for (const mode in modeCounts) {
      if (modeCounts[mode as Mode] > maxCount) {
        maxCount = modeCounts[mode as Mode];
        primaryMode = mode as Mode;
      }
    }
  }
  // If no filtered results, fall back to the original logic
  else if (modesAvailable.length === 1) {
    // Single mode available - use that mode
    primaryMode = modesAvailable[0];
  } else if (modesAvailable.length > 1) {
    // Multiple modes available - use the mode with the most candidates
    let maxCount = 0;
    for (const mode of modesAvailable) {
      const count = candidatesByMode[mode] ?? 0;
      if (count > maxCount) {
        maxCount = count;
        primaryMode = mode;
      }
    }
  }

  return {
    from,
    to,
    date,
    travelClass,
    quota,
    mode: primaryMode,
    modesAvailable: filteredModesAvailable,
    candidatesByMode: filteredCandidatesByMode,
    graph,
    maxConnections,
    candidates: {
      direct: directCount,
      oneConnection: viaHubCount,
      twoConnection: viaTwoHubCount,
      threeConnection: viaThreeHubCount,
    },
    fullyConfirmedCount: annotated.filter((j) => j.fullyConfirmed).length,
    narrative,
    suggestion,
    results: pagedResults,
    mapOverview: buildMapOverview(ranked),
    pagination,
    partial: annotatedPartial,
  };
}

/** Parses+clamps the query params shared by both /api/search and /api/search/multi. */
export function parseCommonParams(searchParams: URLSearchParams) {
  const travelClass = searchParams.get("class") ?? "3A";
  const quota = searchParams.get("quota") ?? "GN";
  const maxHubs = Math.min(100, Math.max(1, Number(searchParams.get("maxHubs") ?? "10") || 10));
  const legacyTwoHub = searchParams.get("twoHub") === "1";
  const maxConnectionsRaw = Number(searchParams.get("maxConnections") ?? (legacyTwoHub ? "2" : "2"));
  const maxConnections = ([1, 2, 3] as const).includes(maxConnectionsRaw as 1 | 2 | 3)
    ? (maxConnectionsRaw as 1 | 2 | 3)
    : 2;
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "10") || 10));

  // Which mode(s) the frontend wants this search to actually query. Comma
  // list, e.g. "train,bus". Omitted, empty, or explicitly "all" all mean
  // the same thing: search every mode with a registered provider (see
  // lib/providers/registry.ts) — this is how the FE's mode toggle (All /
  // Train only / Bus only / ...) reaches the backend, distinct from
  // app/components/ModeSelector.tsx's after-the-fetch display filter.
  const modesRaw = (searchParams.get("modes") ?? "").trim().toLowerCase();
  const modes: Mode[] | undefined =
    !modesRaw || modesRaw === "all"
      ? undefined
      : modesRaw
          .split(",")
          .map((m) => m.trim())
          .filter((m): m is Mode => m === "train" || m === "bus" || m === "flight");

  // Guard against a malformed `modes` value (e.g. "modes=foo") resolving to
  // an empty array, which would otherwise search nothing at all and look
  // like a bug rather than a bad request.
  const safeModes = modes && modes.length > 0 ? modes : undefined;

  // Parse filter parameters
  const sortRaw = searchParams.get("sort") ?? "best";
  const sort = (["best", "cheapest", "fastest", "fewestChanges"] as const).includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "best";

  const connectionsRaw = searchParams.get("connections") ?? "any";
  const connections = (["any", "direct", "oneChange", "twoChanges", "threeChanges"] as const).includes(connectionsRaw as ConnectionFilter)
    ? (connectionsRaw as ConnectionFilter)
    : "any";

  const confirmedOnlyRaw = searchParams.get("confirmedOnly");
  const confirmedOnly = confirmedOnlyRaw === "true";

  const departureRaw = searchParams.get("departure") ?? "any";
  const departure = (["any", "morning", "afternoon", "evening", "night"] as const).includes(departureRaw as DepartureWindow)
    ? (departureRaw as DepartureWindow)
    : "any";

  const arrivalRaw = searchParams.get("arrival") ?? "any";
  const arrival = (["any", "morning", "afternoon", "evening", "night"] as const).includes(arrivalRaw as DepartureWindow)
    ? (arrivalRaw as DepartureWindow)
    : "any";

  const maxFareRaw = searchParams.get("maxFare");
  const maxFare = maxFareRaw !== null ? (maxFareRaw === "" ? null : Number(maxFareRaw)) : null;

  const maxDurationRaw = searchParams.get("maxDuration");
  const maxDuration = maxDurationRaw !== null ? (maxDurationRaw === "" ? null : Number(maxDurationRaw)) : null;

  const transportRaw = searchParams.get("transport") ?? "any";
  const transport = (["any", "train", "bus", "flight", "mixed"] as const).includes(transportRaw as TransportFilter)
    ? (transportRaw as TransportFilter)
    : "any";

  return {
    travelClass,
    quota,
    maxHubs,
    maxConnections,
    pageSize,
    modes: safeModes,
    sort,
    connections,
    confirmedOnly,
    departure,
    arrival,
    maxFare,
    maxDuration,
    transport,
  };
}