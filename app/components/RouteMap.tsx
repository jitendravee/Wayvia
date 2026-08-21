"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { AnnotatedLeg } from "../types";
import { DEFAULT_HUBS } from "@/lib/graph/hubs";
import type { MapPoint } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center bg-surface-alt text-[12px] font-mono text-ink-dim">
      Loading map…
    </div>
  ),
});

const COORDS = new Map(DEFAULT_HUBS.map((h) => [h.code, { lat: h.lat, lon: h.lon, name: h.name }]));

// One geocode per station code per browser session — avoids hammering Nominatim
// when the same junction shows up across several journey cards.
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();

async function geocodeStationCode(code: string): Promise<{ lat: number; lon: number } | null> {
  if (geocodeCache.has(code)) return geocodeCache.get(code)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(
        `${code} railway station India`
      )}`
    );
    if (!res.ok) throw new Error("geocode failed");
    const data = (await res.json()) as { lat: string; lon: string }[];
    const hit = data[0];
    const result = hit ? { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) } : null;
    geocodeCache.set(code, result);
    return result;
  } catch {
    geocodeCache.set(code, null);
    return null;
  }
}

interface Stop {
  code: string;
  time: string;
  kind: MapPoint["kind"];
  meta?: string;
}

export default function RouteMap({ legs }: { legs: AnnotatedLeg[] }) {
  const stops = useMemo<Stop[]>(() => {
    const out: Stop[] = [];
    legs.forEach((leg, i) => {
      if (i === 0) out.push({ code: leg.from, time: leg.departure, kind: "origin" });
      const isLast = i === legs.length - 1;
      // Build the object without the `meta` key at all when there's nothing to put in it,
      // rather than `meta: undefined` — required because MapPoint's `meta` is an optional
      // property, and with exactOptionalPropertyTypes on, "optional" strictly means
      // "key present or absent", not "key present with value undefined".
      out.push({
        code: leg.to,
        time: leg.arrival,
        kind: isLast ? "destination" : "junction",
        ...(leg.trainNo != null ? { meta: `#${leg.trainNo}` } : {}),
      });
    });
    return out;
  }, [legs]);

  const [resolved, setResolved] = useState<Map<string, { lat: number; lon: number }>>(new Map());
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const missing = stops.filter((s) => !COORDS.has(s.code) && !resolved.has(s.code));
    if (missing.length === 0) return;

    setLoadingGeo(true);
    (async () => {
      for (const s of missing) {
        const hit = await geocodeStationCode(s.code);
        if (cancelled) return;
        if (hit) {
          setResolved((prev) => {
            const next = new Map(prev);
            next.set(s.code, hit);
            return next;
          });
        }
        // Nominatim's usage policy caps unauthenticated use at ~1 request/sec.
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) setLoadingGeo(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  const points: MapPoint[] = useMemo(() => {
    const built: MapPoint[] = [];
    for (const s of stops) {
      const known = COORDS.get(s.code);
      const coord = known ?? resolved.get(s.code);
      if (!coord) continue;
      const name = known ? known.name : s.code;
      built.push({
        code: s.code,
        name,
        lat: coord.lat,
        lon: coord.lon,
        kind: s.kind,
        ...(s.meta != null ? { meta: s.meta } : {}),
      });
    }
    return built;
  }, [stops, resolved]);

  if (points.length < 2) {
    if (loadingGeo) {
      return (
        <div className="mt-4 flex h-[200px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-alt text-[12px] font-mono text-ink-dim">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-dim/30 border-t-violet" />
          Locating stations on the map…
        </div>
      );
    }
    return (
      <div className="mt-4 flex h-[120px] w-full items-center justify-center rounded-xl border border-border bg-surface-alt px-4 text-center text-[12px] font-mono text-ink-dim">
        Not enough station coordinates to plot this route on the map.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border-soft bg-surface-alt px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Route map</span>
        <span className="font-mono text-[10px] text-ink-dim">
          {points.length} stop{points.length === 1 ? "" : "s"} plotted
          {loadingGeo ? " · locating more…" : ""}
        </span>
      </div>
      <LeafletMap points={points} />
    </div>
  );
}