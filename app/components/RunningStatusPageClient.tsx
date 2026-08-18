"use client";

import { useState } from "react";
import Link from "next/link";
import RunningStatusTracker from "./RunningStatusTracker";
import { RunningStatusResult } from "@/lib/erail/runningStatus";

export default function RunningStatusPageClient({
  trainNo,
  initialData,
}: {
  trainNo: string;
  initialData: RunningStatusResult;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/erail/runningStatus?trainNo=${trainNo}`, { cache: "no-store" });
      const json: RunningStatusResult = await res.json();
      setData(json);
      if (!json.success && json.message) setError(json.message);
    } catch {
      setError("Couldn't refresh right now — showing the last known status.");
    } finally {
      setLoading(false);
    }
  }

  if (!data.success) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-signal-red-soft text-2xl">
          🚫
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink">
          {data.notFound ? "We couldn't find that train" : "Something went wrong"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-muted">
          {data.message ?? `No running status is available for train ${trainNo} right now.`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-border bg-white px-4 py-2 font-display text-[13px] font-semibold text-ink transition-colors hover:border-violet disabled:opacity-60"
          >
            {loading ? "Retrying…" : "Try again"}
          </button>
          <Link
            href="/running-status"
            className="rounded-lg bg-violet px-4 py-2 font-display text-[13px] font-semibold text-white hover:bg-violet-dark"
          >
            Search another train
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/running-status" className="font-mono text-[12px] text-ink-dim hover:text-violet">
          ← Search another train
        </Link>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 font-mono text-[11.5px] text-ink-muted transition-colors hover:border-violet hover:text-violet disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}>
            <path
              d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 13 2.5M19 9a7 7 0 0 0-13-2.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-l-4 border-signal-amber/40 border-l-signal-amber bg-signal-amber-soft/60 px-4 py-2.5 text-[12.5px] text-ink">
          {error}
        </div>
      )}

      <RunningStatusTracker data={data} />
    </main>
  );
}
