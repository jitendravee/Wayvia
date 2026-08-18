import type { Metadata } from "next";
import { fetchRunningStatus } from "@/lib/erail/runningStatus";
import RunningStatusPageClient from "../../components/RunningStatusPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trainNo: string }>;
}): Promise<Metadata> {
  const { trainNo } = await params;
  return {
    title: `${trainNo} Running Status`,
    description: `Live running status for train ${trainNo} — current location, delay, next stop, and full station-wise schedule, updated in real time.`,
    alternates: { canonical: `/running-status/${trainNo}` },
  };
}

export default async function RunningStatusDetailPage({
  params,
}: {
  params: Promise<{ trainNo: string }>;
}) {
  const { trainNo } = await params;
  const data = await fetchRunningStatus(trainNo).catch(
    () =>
      ({
        success: false,
        trainNo,
        trainName: null,
        runDate: null,
        summary: null,
        position: null,
        stations: [],
        rake: [],
        message: "Couldn't reach the running-status service right now. Please try again in a moment.",
      }) as import("@/lib/erail/runningStatus").RunningStatusResult
  );

  return <RunningStatusPageClient trainNo={trainNo} initialData={data} />;
}
