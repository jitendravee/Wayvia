"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { MapOverviewEntry } from "../types";
import type { PlottableRoute } from "./OverviewMapInner";

const OverviewMapInner = dynamic(() => import("./OverviewMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center bg-surface-alt text-[12px] font-mono text-ink-dim">
      Loading map…
    </div>
  ),
});

const MODE_ICON_LABEL: Record<string, string> = { train: "Train", bus: "Bus", flight: "Flight" };

/**
 * The "ways to get there" overview — every notable route for this search
 * plotted on one map at once, numbered and colored to match the badge each
 * one earned (BEST MATCH, CHEAPEST, FASTEST, GOOD VALUE, MULTIMODAL,
 * ALTERNATIVE). All the coordinate work happens server-side now
 * (lib/mapOverview.ts + lib/geo.ts) — this component just plots whatever
 * `mapOverview` the search response already carries.
 */
export default function OverviewMap({ entries }: { entries: MapOverviewEntry[] }) {
  const routes: PlottableRoute[] = useMemo(
    () =>
      entries
        .map((entry) => ({
          entry,
          points: entry.stops.filter((s): s is typeof s & { lat: number; lon: number } => s.lat !== null && s.lon !== null),
        }))
        .filter((r) => r.points.length >= 2),
    [entries]
  );

  if (routes.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-surface-alt px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Ways to get there — overview</span>
        <span className="font-mono text-[10px] text-ink-dim">
          {routes.length} route{routes.length === 1 ? "" : "s"} plotted
        </span>
      </div>

      <OverviewMapInner routes={routes} />

      <div className="flex flex-wrap gap-2 border-t border-border-soft bg-surface-alt/40 px-4 py-3">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 font-mono text-[11px] text-ink-muted shadow-sm"
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white"
              style={{ background: e.color }}
            >
              {e.rank}
            </span>
            <span className="font-semibold text-ink">{e.label}</span>
            <span className="text-ink-dim">
              {e.modes.map((m) => MODE_ICON_LABEL[m] ?? m).join(" + ")} · {e.connections === 0 ? "direct" : `${e.connections} conn.`}
              {e.totalFare !== null ? ` · ₹${e.totalFare}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
