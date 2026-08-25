import { NextRequest, NextResponse } from "next/server";
import { discoverJourneys } from "@/lib/graph/discover";
import { annotateWithAvailability, annotatePartialCoverage } from "@/lib/availability";
import { rankJourneys, buildNarrative } from "@/lib/score";
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
}

/**
 * Runs one point-to-point journey search end to end: structural discovery
 * (direct + hub graph, mode-agnostic, doesn't know about class/quota),
 * live availability + fare annotation (class/quota-specific), ranking, and
 * pagination. This is the entire body of a single /api/search call — pulled
 * out so a multi-city itinerary (A→B on date1, B→C on date2, ...) can reuse
 * it leg by leg instead of the multi-city route reimplementing any of it.
 */
export async function runJourneySearch(params: JourneySearchParams): Promise<SearchResponse> {
  const { from, to, date, travelClass, quota, maxHubs, maxConnections, page, pageSize } = params;

  const { direct, viaHub, viaTwoHub, viaThreeHub, partial, graph, suggestion } = await discoverJourneys(from, to, {
    date,
    maxHubs,
    maxConnections,
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
      modesAvailable: ["train"],
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
    modesAvailable: ["train"],
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
  return { travelClass, quota, maxHubs, maxConnections, pageSize };
}

/**
 * GET /api/search — single point-to-point journey search. Reads from/to/date
 * plus the shared class/quota/maxHubs/maxConnections/page/pageSize params
 * and runs them through runJourneySearch.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = (searchParams.get("from") ?? "").trim().toUpperCase();
  const to = (searchParams.get("to") ?? "").trim().toUpperCase();
  const date = (searchParams.get("date") ?? "").trim();

  if (!from || !to || !date) {
    return NextResponse.json(
      { error: "from, to, and date are required, e.g. /api/search?from=NDLS&to=BCT&date=2026-08-24" },
      { status: 400 }
    );
  }
  if (from === to) {
    return NextResponse.json({ error: "from and to can't be the same station." }, { status: 400 });
  }

  const { travelClass, quota, maxHubs, maxConnections, pageSize } = parseCommonParams(searchParams);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  try {
    const response = await runJourneySearch({
      from,
      to,
      date,
      travelClass,
      quota,
      maxHubs,
      maxConnections,
      page,
      pageSize,
    });
    return NextResponse.json(response);
  } catch (err) {
    console.error("GET /api/search failed:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}