import { NextRequest, NextResponse } from "next/server";
import { ixigoAutocomplete } from "@/lib/providers/ixigo/client";

/**
 * GET /api/bus-cities?q=Hyderab
 *
 * Not called anywhere in the search pipeline itself — lib/providers/ixigo/
 * cityResolve.ts calls ixigoAutocomplete() directly for that. This route
 * exists so you can sanity-check city resolution independently of a full
 * journey search, e.g. while confirming the GetBusList request shape (see
 * the comment atop lib/providers/ixigoBus.ts): hit this with a city name,
 * confirm the `id` you get back is the one you expect, then use that id to
 * hand-test a GetBusList call.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await ixigoAutocomplete(q);
  return NextResponse.json({ query: q, results });
}
