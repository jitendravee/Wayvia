import { NextRequest, NextResponse } from "next/server";
import { discoverJourneys } from "@/lib/graph/discover";
import { annotateWithAvailability } from "@/lib/availability";
import { rankJourneys, buildNarrative } from "@/lib/score";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = req.nextUrl.searchParams.get("to")?.toUpperCase();
  const date = req.nextUrl.searchParams.get("date"); // 'YYYY-MM-DD'
  const travelClass = req.nextUrl.searchParams.get("class") ?? "3A";
  const quota = req.nextUrl.searchParams.get("quota") ?? "GN";
  const maxHubs = Number(req.nextUrl.searchParams.get("maxHubs") ?? "10");

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
    // zero-transfer layer of the route graph.
    const { direct, viaHub, graph } = await discoverJourneys(from, to, { date, maxHubs });
    const allCandidates = [...direct, ...viaHub];

    if (allCandidates.length === 0) {
      const narrative = buildNarrative(null, 0, 0);
      return NextResponse.json({
        from,
        to,
        date,
        mode: "train",
        modesAvailable: ["train"], // bus / flight slot in here once wired up
        graph,
        candidates: { direct: 0, oneConnection: 0, twoConnection: 0 },
        narrative,
        results: null,
      });
    }

    // 2. LIVE AVAILABILITY + FARE — one batched call across all surviving candidates.
    const annotated = await annotateWithAvailability(allCandidates, date, travelClass, quota);

    // 2b. TEMPORARY: only surface journeys with confirmed seats on every
    // leg. WAITLIST/RAC/UNKNOWN statuses are hidden for now rather than
    // shown-but-deprioritized, since an UNKNOWN-status leg was ending up
    // in the top slot and reading as broken. Revisit once "unknown"
    // (erail gave no/garbled avl data) gets its own proper handling —
    // at that point this can go back to showing everything, ranked.
    const availableOnly = annotated.filter((j) => j.fullyConfirmed);

    // 3. RANKING — happens only after structure + availability are both known.
    const ranked = rankJourneys(availableOnly);
    const narrative = buildNarrative(ranked, direct.length, viaHub.length, annotated.length, availableOnly.length);

    return NextResponse.json({
      from,
      to,
      date,
      travelClass,
      quota,
      mode: "train",
      modesAvailable: ["train"], // bus / flight slot in here once wired up
      graph,
      candidates: {
        direct: direct.length,
        oneConnection: viaHub.length,
        twoConnection: 0, // future: depth-2 graph expansion
      },
      fullyConfirmedCount: annotated.filter((j) => j.fullyConfirmed).length,
      narrative,
      results: ranked,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
