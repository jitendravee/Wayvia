import { NextRequest, NextResponse } from "next/server";
import { searchStations } from "@/lib/stations";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8") || 8);

  const results = await searchStations(q, limit);
  return NextResponse.json({ query: q, results });
}