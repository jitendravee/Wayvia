import { NextRequest, NextResponse } from "next/server";
import { runJourneySearch, parseCommonParams } from "@/lib/searchJourney";

/**
 * GET /api/search — single point-to-point journey search.
 *
 * This used to have its own, separate copy of the search pipeline (train
 * only, hardcoded to `discoverJourneys` + `modesAvailable: ["train"]`),
 * which is why bus/flight results never showed up here even after the
 * multimodal pipeline (lib/journey/searchService.ts) and mock bus/flight
 * providers (lib/providers/*) were wired in for /api/search/multi. That
 * duplication is gone now — both routes share the exact same
 * `runJourneySearch` in lib/searchJourney.ts, so a fix or a new mode here
 * applies everywhere at once.
 *
 * Query params (see lib/searchJourney.ts's parseCommonParams for the full
 * list): from, to, date are required. `modes` is how the frontend controls
 * *what gets searched*, not just how results are displayed afterwards —
 * e.g. `?modes=train` searches trains only, `?modes=bus,flight` searches
 * only those two, and omitting it (or `?modes=all`) searches every mode
 * with a registered provider (today: train + mock bus + mock flight).
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = (searchParams.get("from") ?? "").trim();
  const to = (searchParams.get("to") ?? "").trim();
  const date = (searchParams.get("date") ?? "").trim();

  if (!from || !to || !date) {
    return NextResponse.json(
      { error: "from, to, and date are required, e.g. /api/search?from=pune&to=mumbai&date=2026-08-29&modes=train,bus" },
      { status: 400 }
    );
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    return NextResponse.json({ error: "from and to can't be the same place." }, { status: 400 });
  }

  const { travelClass, quota, maxHubs, maxConnections, pageSize, modes, sort, connections, confirmedOnly, departure, arrival, maxFare, maxDuration, transport } = parseCommonParams(searchParams);
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
      modes,
      sort,
      connections,
      confirmedOnly,
      departure,
      arrival,
      maxFare,
      maxDuration,
      transport,
    });
    return NextResponse.json(response);
  } catch (err) {
    console.error("GET /api/search failed:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
