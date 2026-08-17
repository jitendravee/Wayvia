import { NextRequest, NextResponse } from "next/server";
import { getTrain } from "@/lib/erail/client";

export async function GET(req: NextRequest) {
  const trainNo = req.nextUrl.searchParams.get("trainNo");
  if (!trainNo) return NextResponse.json({ error: "trainNo is required" }, { status: 400 });
  try {
    const json = await getTrain(trainNo);
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
