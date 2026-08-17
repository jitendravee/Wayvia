import { NextRequest, NextResponse } from "next/server";
import { pnrStatus } from "@/lib/erail/client";

export async function GET(req: NextRequest) {
  const pnr = req.nextUrl.searchParams.get("pnr");
  if (!pnr) return NextResponse.json({ error: "pnr is required" }, { status: 400 });
  try {
    const json = await pnrStatus(pnr);
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
