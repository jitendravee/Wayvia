import { NextRequest, NextResponse } from "next/server";
import { stationLive } from "@/lib/erail/client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });
  try {
    const json = await stationLive(code);
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
