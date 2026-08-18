"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { AnnotatedLeg } from "../types";
import { DEFAULT_HUBS } from "@/lib/graph/hubs";
import type { MapPoint } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] w-full items-center justify-center bg-surface-alt text-[12px] font-mono text-ink-dim">
      Loading map…
    </div>
  ),
});

const COORDS = new Map(DEFAULT_HUBS.map((h) => [h.code, { lat: h.lat, lon: h.lon, name: h.name }]));

export default function RouteMap({ legs }: { legs: AnnotatedLeg[] }) {
  const points: MapPoint[] = useMemo(() => {
    const codes: string[] = [];
    legs.forEach((leg, i) => {
      if (i === 0) codes.push(leg.from);
      codes.push(leg.to);
    });
    return codes
      .map((code) => {
        const c = COORDS.get(code);
        return c ? { code, name: c.name, lat: c.lat, lon: c.lon } : null;
      })
      .filter((p): p is MapPoint => p !== null);
  }, [legs]);

  if (points.length < 2) return null; // not enough geo data to plot a meaningful map for this journey

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border-soft bg-surface-alt px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Route map</span>
        <span className="font-mono text-[10px] text-ink-dim">
          {points.length} stop{points.length === 1 ? "" : "s"} plotted
        </span>
      </div>
      <LeafletMap points={points} />
    </div>
  );
}
