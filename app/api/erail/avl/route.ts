import { NextRequest, NextResponse } from "next/server";
import { fetchAvailability } from "@/lib/erail/avl";

/**
 * Manual test endpoint: GET /api/erail/avl?keys=12908_NZM_BDTS_3A_GN_17-8,12926_NDLS_BDTS_3A_GN_17-8
 * Useful for checking whether buildAvlRequest() in lib/erail/avl.ts actually
 * matches what s.erail.in expects, independent of the rest of the search pipeline.
 */
export async function GET(req: NextRequest) {
  const keysParam = req.nextUrl.searchParams.get("keys");
  if (!keysParam) return NextResponse.json({ error: "keys is required, comma-separated avl keys" }, { status: 400 });
  const keys = keysParam.split(",").map((k) => k.trim());
  try {
    const result = await fetchAvailability(keys);
    return NextResponse.json({
      availability: Object.fromEntries(result.availability),
      fares: Object.fromEntries(result.fares),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
