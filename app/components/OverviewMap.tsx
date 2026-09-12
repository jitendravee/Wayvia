"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import type { MapOverviewEntry, RouteStop } from "../types";
import type { PlottableRoute } from "./OverviewMapInner";
import { getStationCoord } from "@/lib/geo";

const OverviewMapInner = dynamic(() => import("./OverviewMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center bg-[#e8f4fc] text-[12px] font-mono text-slate-500">
      Loading interactive map…
    </div>
  ),
});

const MODE_ICON_LABEL: Record<string, string> = {
  train: "Train",
  bus: "Bus",
  flight: "Flight",
};

export default function OverviewMap({
  height,
  entries,
  activeRouteRank,
  onSelectRouteRank,
}: {
  entries: MapOverviewEntry[];
  height?: number;
  activeRouteRank?: number | null;
  onSelectRouteRank?: (rank: number) => void;
}) {
  const [selectedRank, setSelectedRank] = useState<number>(
    activeRouteRank ?? entries[0]?.rank ?? 1,
  );

  useEffect(() => {
    if (activeRouteRank !== undefined && activeRouteRank !== null) {
      setSelectedRank(activeRouteRank);
    }
  }, [activeRouteRank]);

  const routes: PlottableRoute[] = useMemo(
    () =>
      entries
        .map((entry) => ({
          entry,
          points: entry.stops
            .map((s) => {
              if (s.lat !== null && s.lon !== null) {
                return s as RouteStop & { lat: number; lon: number };
              }
              const resolved =
                getStationCoord(s.code) || getStationCoord(s.name);
              if (resolved) {
                return {
                  ...s,
                  lat: resolved.lat,
                  lon: resolved.lon,
                  name: resolved.name,
                } as RouteStop & { lat: number; lon: number };
              }
              return null;
            })
            .filter(
              (s): s is RouteStop & { lat: number; lon: number } => s !== null,
            ),
        }))
        .filter((r) => r.points.length >= 2),
    [entries],
  );

  if (routes.length === 0) return null;

  const activeRoute =
    routes.find((r) => r.entry.rank === selectedRank) ?? routes[0];

  const handleSelectRoute = (id: string, rank: number) => {
    setSelectedRank(rank);
    onSelectRouteRank?.(rank);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
            Route Overview & Alternatives
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {routes.length} route{routes.length === 1 ? "" : "s"} plotted · click
          route to inspect
        </span>
      </div>

      <div style={{ height: height ?? 460 }} className="w-full relative">
        <OverviewMapInner
          routes={routes}
          activeId={activeRoute?.entry.id}
          onSelectRoute={handleSelectRoute}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 p-3">
        {entries.map((e) => {
          const isSelected = e.rank === selectedRank;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => handleSelectRoute(e.id, e.rank)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? "border-blue-600 bg-blue-50/90 text-blue-950 font-semibold ring-1 ring-blue-500/30 shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9.5px] font-bold text-white transition-transform ${
                  isSelected ? "scale-110" : ""
                }`}
                style={{
                  background: isSelected
                    ? "#2563eb"
                    : e.rank === 1
                      ? "#8b5cf6"
                      : "#94a3b8",
                }}
              >
                {e.rank}
              </span>
              <span className="font-semibold">{e.label}</span>
              <span
                className={isSelected ? "text-blue-700/80" : "text-slate-400"}
              >
                {e.modes.map((m) => MODE_ICON_LABEL[m] ?? m).join(" + ")} ·{" "}
                {e.connections === 0 ? "direct" : `${e.connections} conn.`}
                {e.totalFare !== null ? ` · ₹${e.totalFare}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
