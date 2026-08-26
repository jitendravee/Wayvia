import { NextRequest, NextResponse } from "next/server";
import { runJourneySearch, parseCommonParams } from "@/lib/searchJourney";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = req.nextUrl.searchParams.get("to")?.toUpperCase();
  const date = req.nextUrl.searchParams.get("date"); // 'YYYY-MM-DD'
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const { travelClass, quota, maxHubs, maxConnections, pageSize, modes } = parseCommonParams(req.nextUrl.searchParams);

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required (station codes, e.g. NDLS, BCT)" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "date is required, format YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const result = await runJourneySearch({ from, to, date, travelClass, quota, maxHubs, maxConnections, page, pageSize, modes });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}