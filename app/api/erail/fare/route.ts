import { NextRequest, NextResponse } from "next/server";
import { fetchTrainFare } from "@/lib/erail/fare";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const trainNo = searchParams.get("trainNo");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!trainNo || !from || !to) {
    return NextResponse.json(
      { error: "trainNo, from, and to are required query parameters" },
      { status: 400 }
    );
  }

  try {
    const fares = await fetchTrainFare(trainNo, from, to);
    return NextResponse.json({
      success: true,
      trainNo,
      from,
      to,
      fares,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
