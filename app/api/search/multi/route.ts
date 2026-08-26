import { NextRequest, NextResponse } from "next/server";
import { runJourneySearch, parseCommonParams } from "@/lib/searchJourney";
import type { TripLeg, MultiSearchResponse } from "@/app/types";

const MAX_LEGS = 6;

function parseLegs(raw: string | null): TripLeg[] | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length < 2) return null;

  const legs: TripLeg[] = [];
  for (const item of parsed) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as Partial<TripLeg>).from !== "string" ||
      typeof (item as Partial<TripLeg>).to !== "string" ||
      typeof (item as Partial<TripLeg>).date !== "string"
    ) {
      return null;
    }
    const from = (item as TripLeg).from.trim().toUpperCase();
    const to = (item as TripLeg).to.trim().toUpperCase();
    const date = (item as TripLeg).date.trim();
    if (!from || !to || !date) return null;
    legs.push({ from, to, date });
  }
  return legs;
}

/**
 * A "multi-city" trip is just a chain of ordinary point-to-point searches —
 * A→B on date1, then B→C on date2, and so on — each stop chosen by the
 * person, not auto-discovered like the single-search hub graph is. Every
 * leg runs through the exact same discovery/availability/ranking pipeline
 * as /api/search, independently and in parallel, and comes back as its own
 * full SearchResponse so the frontend can filter/paginate each leg on its
 * own terms.
 */
export async function GET(req: NextRequest) {
  const legs = parseLegs(req.nextUrl.searchParams.get("legs"));

  if (!legs) {
    return NextResponse.json(
      { error: 'legs is required: a JSON array of at least 2 {"from","to","date"} stops, e.g. legs=[{"from":"NDLS","to":"BCT","date":"2026-08-24"},{"from":"BCT","to":"JP","date":"2026-08-27"}]' },
      { status: 400 }
    );
  }
  if (legs.length > MAX_LEGS) {
    return NextResponse.json({ error: `A trip can have at most ${MAX_LEGS} stops.` }, { status: 400 });
  }
  for (const leg of legs) {
    if (leg.from === leg.to) {
      return NextResponse.json({ error: `Consecutive stops can't be the same station (${leg.from}).` }, { status: 400 });
    }
  }

  const { travelClass, quota, maxHubs, maxConnections, pageSize, modes } = parseCommonParams(req.nextUrl.searchParams);

  // Optional per-leg page numbers, e.g. pages=1,2 — used when the person
  // paginates one leg's results without needing to re-search every other
  // leg. Defaults to page 1 for every leg.
  const pagesRaw = req.nextUrl.searchParams.get("pages");
  const pages = pagesRaw ? pagesRaw.split(",").map((p) => Math.max(1, Number(p) || 1)) : [];

  try {
    const results = await Promise.all(
      legs.map((leg, i) =>
        runJourneySearch({
          from: leg.from,
          to: leg.to,
          date: leg.date,
          travelClass,
          quota,
          maxHubs,
          maxConnections,
          page: pages[i] ?? 1,
          pageSize,
          modes,
        })
      )
    );

    const response: MultiSearchResponse = { legs, results };
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}