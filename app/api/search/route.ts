import { NextRequest, NextResponse } from "next/server";
import { discoverJourneys } from "@/lib/graph/discover";
import { annotateWithAvailability, annotatePartialCoverage } from "@/lib/availability";
import { rankJourneys, buildNarrative } from "@/lib/score";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = req.nextUrl.searchParams.get("to")?.toUpperCase();
  const date = req.nextUrl.searchParams.get("date"); // 'YYYY-MM-DD'
  const travelClass = req.nextUrl.searchParams.get("class") ?? "3A";
  const quota = req.nextUrl.searchParams.get("quota") ?? "GN";
  // No longer capped to a curated ~34-station list — the hub pool now merges the static geo
  // list with the live erail.in station directory + anything discovered from real routes, so
  // this slider genuinely controls how many candidate junctions get queried per search.
  const maxHubs = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("maxHubs") ?? "10") || 10));
  // "junctions" slider: how many via-junctions (interchange stations) the person
  // is willing to have searched — 1 (direct + 1 change), 2, or 3. `twoHub=1` is
  // kept working as a legacy alias for maxConnections=2 for any older callers.
  const legacyTwoHub = req.nextUrl.searchParams.get("twoHub") === "1";
  const maxConnectionsRaw = Number(req.nextUrl.searchParams.get("maxConnections") ?? (legacyTwoHub ? "2" : "2"));
  const maxConnections = ([1, 2, 3] as const).includes(maxConnectionsRaw as 1 | 2 | 3)
    ? (maxConnectionsRaw as 1 | 2 | 3)
    : 2;
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? "10") || 10));

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required (station codes, e.g. NDLS, BCT)" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "date is required, format YYYY-MM-DD" }, { status: 400 });
  }

  try {
    // 1. STRUCTURAL DISCOVERY. Direct search and hub-graph expansion both
    // run every time, in parallel — availability never gates whether we
    // bother looking for alternatives. Direct trains are just the
    // zero-transfer layer of the route graph. When the cheap tiers come up
    // thin, discoverJourneys also escalates to real-route-derived hubs and
    // 2-connection chains, and computes "partial coverage" (real trains
    // that only complete part of the journey) — see lib/graph/discover.ts.
    const { direct, viaHub, viaTwoHub, viaThreeHub, partial, graph, suggestion } = await discoverJourneys(from, to, {
      date,
      maxHubs,
      maxConnections,
    });
    const allCandidates = [...direct, ...viaHub, ...viaTwoHub, ...viaThreeHub];

    if (allCandidates.length === 0) {
      const annotatedPartial = await annotatePartialCoverage(partial, date, travelClass, quota);
      const narrative = buildNarrative(null, 0, 0, 0, 0, annotatedPartial.length, 0, 0);
      return NextResponse.json({
        from,
        to,
        date,
        mode: "train",
        modesAvailable: ["train"], // bus / flight slot in here once wired up
        graph,
        maxConnections,
        candidates: { direct: 0, oneConnection: 0, twoConnection: 0, threeConnection: 0 },
        narrative,
        suggestion,
        results: null,
        partial: annotatedPartial,
      });
    }

    // 2. LIVE AVAILABILITY + FARE — one batched call across all surviving candidates
    // (direct + 1-hub + 2-hub together), plus a separate small batch for partial results.
    const [annotated, annotatedPartial] = await Promise.all([
      annotateWithAvailability(allCandidates, date, travelClass, quota),
      annotatePartialCoverage(partial, date, travelClass, quota),
    ]);

    // 2b. TEMPORARY: only surface journeys with confirmed seats on every
    // leg. WAITLIST/RAC/UNKNOWN statuses are hidden for now rather than
    // shown-but-deprioritized, since an UNKNOWN-status leg was ending up
    // in the top slot and reading as broken. Revisit once "unknown"
    // (erail gave no/garbled avl data) gets its own proper handling —
    // at that point this can go back to showing everything, ranked.
    const availableOnly = annotated.filter((j) => j.fullyConfirmed);

    // 3. RANKING — happens only after structure + availability are both known.
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

    // 4. PAGINATION — applied to the "all" list only, after full ranking.
    // bestOverall / cheapest / fastest / etc always reflect the complete,
    // unpaginated result set so the top picks never shift page to page.
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

    return NextResponse.json({
      from,
      to,
      date,
      travelClass,
      quota,
      mode: "train",
      modesAvailable: ["train"], // bus / flight slot in here once wired up
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
      // Only meaningful when the primary result set is thin — see THIN_RESULTS_THRESHOLD
      // in lib/graph/discover.ts — but always returned so the FE can decide how to show it.
      partial: annotatedPartial,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}