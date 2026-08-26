import { discoverMultimodal } from "@/lib/graph/discoverMultimodal";
import { annotateWithAvailability, annotatePartialCoverage } from "@/lib/availability";
import { rankJourneys, buildNarrative } from "@/lib/score";
import type { Mode } from "@/lib/graph/types";
import type { SearchResponse } from "@/app/types";

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
  const { from, to, date, travelClass, quota, maxHubs, maxConnections, page, pageSize, modes } = params;

  const { direct, viaHub, viaTwoHub, viaThreeHub, partial, graph, suggestion, modesAvailable } = await discoverMultimodal(from, to, {
    date,
    maxHubs,
    maxConnections,
    modes,
  });
  const allCandidates = [...direct, ...viaHub, ...viaTwoHub, ...viaThreeHub];

  if (allCandidates.length === 0) {
    const annotatedPartial = await annotatePartialCoverage(partial, date, travelClass, quota);
    const narrative = buildNarrative(null, 0, 0, 0, 0, annotatedPartial.length, 0, 0);
    return {
      from,
      to,
      date,
      travelClass,
      quota,
      mode: "train",
      modesAvailable,
      graph,
      maxConnections,
      candidates: { direct: 0, oneConnection: 0, twoConnection: 0, threeConnection: 0 },
      narrative,
      suggestion,
      results: null,
      partial: annotatedPartial,
    };
  }

  const [annotated, annotatedPartial] = await Promise.all([
    annotateWithAvailability(allCandidates, date, travelClass, quota),
    annotatePartialCoverage(partial, date, travelClass, quota),
  ]);

  const availableOnly = annotated.filter((j) => j.fullyConfirmed);

  const ranked = rankJourneys(availableOnly);
  const narrative = buildNarrative(
    ranked,
    direct.length,
    viaHub.length,
    annotated.length,
    availableOnly.length,
    annotatedPartial.length,
    viaTwoHub.length,
    viaThreeHub.length
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

  return {
    from,
    to,
    date,
    travelClass,
    quota,
    mode: "train",
    modesAvailable,
    graph,
    maxConnections,
    candidates: {
      direct: direct.length,
      oneConnection: viaHub.length,
      twoConnection: viaTwoHub.length,
      threeConnection: viaThreeHub.length,
    },
    fullyConfirmedCount: annotated.filter((j) => j.fullyConfirmed).length,
    narrative,
    suggestion,
    results: pagedResults,
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

  const modesRaw = searchParams.get("modes"); // comma list, e.g. "train,bus" — omitted means "search everything available"
  const modes = modesRaw
    ? (modesRaw.split(",").map((m) => m.trim().toLowerCase()).filter((m): m is Mode => m === "train" || m === "bus" || m === "flight"))
    : undefined;

  return { travelClass, quota, maxHubs, maxConnections, pageSize, modes };
}