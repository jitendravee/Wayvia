import { NextRequest, NextResponse } from "next/server";
import { fetchRunningStatus } from "@/lib/erail/runningStatus";

export async function GET(req: NextRequest) {
  const trainNo = req.nextUrl.searchParams.get("trainNo")?.trim();
  const date = req.nextUrl.searchParams.get("date") ?? undefined;

  if (!trainNo) {
    return NextResponse.json({ error: "trainNo is required" }, { status: 400 });
  }
  if (!/^\d{4,5}$/.test(trainNo)) {
    return NextResponse.json(
      { error: `"${trainNo}" doesn't look like a valid train number.` },
      { status: 400 }
    );
  }

  try {
    const result = await fetchRunningStatus(trainNo, date);
    if (!result.success) {
      return NextResponse.json(result, { status: result.notFound ? 404 : 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { success: false, trainNo, error: (e as Error).message || "Failed to fetch running status." },
      { status: 500 }
    );
  }
}
