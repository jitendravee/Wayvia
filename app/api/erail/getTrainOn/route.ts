import { NextRequest, NextResponse } from "next/server";
import { getTrainsOnDate } from "@/lib/erail/client";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const date = req.nextUrl.searchParams.get("date"); // DD-MM-YYYY
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  if (!date) return NextResponse.json({ success: false, time_stamp: Date.now(), data: "Please Add Specific Date" });
  try {
    const json = await getTrainsOnDate(from, to, date);
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
