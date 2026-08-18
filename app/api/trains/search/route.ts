import { NextRequest, NextResponse } from "next/server";
import { searchTrains } from "@/lib/erail/trainSearch";
import { searchLocalTrains } from "@/lib/trains";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(10, Number(req.nextUrl.searchParams.get("limit") ?? "6") || 6);

  if (!q.trim()) {
    return NextResponse.json({ query: q, results: [] });
  }

  try {
    const results = await searchTrains(q, limit);
    return NextResponse.json({ query: q, results });
  } catch {
    // Live lookup failed entirely (network, timeout, parsing) — local
    // fallback keeps the search box usable rather than showing nothing.
    return NextResponse.json({ query: q, results: searchLocalTrains(q, limit) });
  }
}
