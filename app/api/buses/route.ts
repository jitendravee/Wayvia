import { NextResponse } from "next/server";
import { ixigoGetBusList } from "@/lib/providers/ixigo/client";

/**
 * Thin passthrough to ixigo's GetBusList, kept for any direct/manual
 * calls (e.g. testing a request body from the browser console). The
 * actual journey-search pipeline does NOT call this route — it goes
 * through lib/providers/ixigoBus.ts, which calls the same underlying
 * ixigoGetBusList() directly (no self-HTTP round trip). Both paths share
 * this one fetch implementation (lib/providers/ixigo/client.ts) so there's
 * a single place to fix headers/URL if ixigo ever changes them.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await ixigoGetBusList(body);
    return NextResponse.json(data);
  } catch (err) {
    console.error("POST /api/buses failed:", err);
    return NextResponse.json({ error: "Failed to fetch bus data from server" }, { status: 500 });
  }
}
