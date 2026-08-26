"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapOverviewEntry, RouteStop } from "../types";

interface PlottableRoute {
  entry: MapOverviewEntry;
  /** Only the stops we actually have coordinates for — a route with fewer than 2 known stops can't be drawn and is skipped. */
  points: (RouteStop & { lat: number; lon: number })[];
}

function numberedIconHtml(n: number, color: string) {
  return `
    <div class="wv-ov-pin" style="background:${color}">
      <span>${n}</span>
    </div>`;
}

function stopIconHtml(color: string, filled: boolean) {
  return `<div class="wv-ov-stop" style="border-color:${color};${filled ? `background:${color};` : "background:white;"}"></div>`;
}

function FitAllBounds({ routes }: { routes: PlottableRoute[] }) {
  const map = useMap();
  useEffect(() => {
    const all = routes.flatMap((r) => r.points.map((p) => [p.lat, p.lon] as [number, number]));
    if (all.length < 2) return;
    map.fitBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 8 });
  }, [routes, map]);
  return null;
}

export default function OverviewMapInner({ routes }: { routes: PlottableRoute[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    const all = routes.flatMap((r) => r.points);
    if (all.length === 0) return [22.5, 79];
    return [all.reduce((s, p) => s + p.lat, 0) / all.length, all.reduce((s, p) => s + p.lon, 0) / all.length];
  }, [routes]);

  if (routes.length === 0) return null;

  return (
    <div className="relative h-[420px] w-full overflow-hidden">
      <MapContainer center={center} zoom={5} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routes.map((r) => {
          const dimmed = activeId !== null && activeId !== r.entry.id;
          const path = r.points.map((p) => [p.lat, p.lon]) as [number, number][];
          return (
            <div key={r.entry.id} style={{ display: "contents" }}>
              <Polyline
                positions={path}
                pathOptions={{ color: r.entry.color, weight: activeId === r.entry.id ? 5 : 3, opacity: dimmed ? 0.18 : 0.75 }}
                eventHandlers={{
                  mouseover: () => setActiveId(r.entry.id),
                  mouseout: () => setActiveId(null),
                }}
              />
              {r.points.map((p, i) => {
                const isOrigin = i === 0;
                const isDest = i === r.points.length - 1;
                return (
                  <Marker
                    key={`${r.entry.id}-${p.code}-${i}`}
                    position={[p.lat, p.lon]}
                    icon={
                      isOrigin
                        ? L.divIcon({
                            html: numberedIconHtml(r.entry.rank, r.entry.color),
                            className: "wv-icon-reset",
                            iconSize: [26, 26],
                            iconAnchor: [13, 13],
                          })
                        : L.divIcon({
                            html: stopIconHtml(r.entry.color, isDest),
                            className: "wv-icon-reset",
                            iconSize: [14, 14],
                            iconAnchor: [7, 7],
                          })
                    }
                    eventHandlers={{
                      mouseover: () => setActiveId(r.entry.id),
                      mouseout: () => setActiveId(null),
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        <FitAllBounds routes={routes} />
      </MapContainer>

      <div className="pointer-events-none absolute right-2 top-2 flex max-w-[180px] flex-col gap-1 rounded-lg border border-white/60 bg-white/95 p-2 shadow-sm backdrop-blur">
        {routes.map((r) => (
          <div key={r.entry.id} className="flex items-center gap-1.5">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white"
              style={{ background: r.entry.color }}
            >
              {r.entry.rank}
            </span>
            <span className="truncate font-mono text-[10px] font-medium text-ink">{r.entry.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .wv-icon-reset { background: transparent; border: none; }
        .wv-ov-pin {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          font-family: inherit; font-size: 12px; font-weight: 700; color: white;
        }
        .wv-ov-stop {
          width: 14px; height: 14px; border-radius: 50%;
          border: 3px solid; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .leaflet-container { background: #eef1f8; font-family: inherit; }
      `}</style>
    </div>
  );
}

export type { PlottableRoute };
