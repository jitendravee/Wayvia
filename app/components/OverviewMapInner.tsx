"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapOverviewEntry, RouteStop } from "../types";

export interface PlottableRoute {
  entry: MapOverviewEntry;
  /** Only stops with valid coordinates */
  points: (RouteStop & { lat: number; lon: number })[];
}

/** Clean name formatting for station labels */
function cleanStationName(name: string, code: string): string {
  if (!name || name === code) return code;
  return name
    .replace(/\b(JN|JUNCTION|TERMINUS|TERMINAL|CANTT|CENTRAL|MAIN)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Computes the geodesic midpoint along a polyline to place the numbered badge */
function getPolylineMidpoint(
  points: { lat: number; lon: number }[],
): [number, number] {
  if (points.length === 0) return [22.5, 79];
  if (points.length === 1) return [points[0].lat, points[0].lon];

  let totalDist = 0;
  const dists: number[] = [0];
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(
      points[i + 1].lat - points[i].lat,
      points[i + 1].lon - points[i].lon,
    );
    totalDist += d;
    dists.push(totalDist);
  }

  const halfDist = totalDist / 2;
  for (let i = 0; i < dists.length - 1; i++) {
    if (halfDist >= dists[i] && halfDist <= dists[i + 1]) {
      const segLen = dists[i + 1] - dists[i];
      const ratio = segLen > 0 ? (halfDist - dists[i]) / segLen : 0;
      return [
        points[i].lat + (points[i + 1].lat - points[i].lat) * ratio,
        points[i].lon + (points[i + 1].lon - points[i].lon) * ratio,
      ];
    }
  }

  const mid = Math.floor(points.length / 2);
  return [points[mid].lat, points[mid].lon];
}

/* ------------------------------------------------------------------ */
/* Custom HTML Markers matching the Reference Screenshot                */
/* ------------------------------------------------------------------ */

function originIconHtml(label: string) {
  return `
    <div class="wv-marker-container">
      <div class="wv-ring-origin">
        <div class="wv-ring-origin-outer"></div>
        <div class="wv-ring-origin-inner"></div>
      </div>
      <div class="wv-station-label wv-label-top">${label}</div>
    </div>`;
}

function destIconHtml(label: string) {
  return `
    <div class="wv-marker-container">
      <div class="wv-ring-dest">
        <div class="wv-ring-dest-outer"></div>
        <div class="wv-ring-dest-inner"></div>
      </div>
      <div class="wv-station-label wv-label-bottom">${label}</div>
    </div>`;
}

function intermediateStopHtml(label: string) {
  return `
    <div class="wv-marker-container">
      <div class="wv-ring-stop"></div>
      <div class="wv-station-label wv-label-right">${label}</div>
    </div>`;
}

function routeBadgeHtml(rank: number, isActive: boolean) {
  let badgeColor = "#94a3b8"; // default slate
  if (rank === 1)
    badgeColor = "#8b5cf6"; // purple
  else if (rank === 2)
    badgeColor = "#2563eb"; // royal blue
  else if (rank === 3)
    badgeColor = "#94a3b8"; // slate
  else if (rank === 4) badgeColor = "#94a3b8"; // slate

  if (isActive) {
    badgeColor = "#2563eb"; // active is always vivid blue
  }

  return `
    <div class="wv-badge-wrap ${isActive ? "wv-badge-active" : ""}">
      <div class="wv-route-badge" style="background-color: ${badgeColor};">
        ${rank}
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Custom Zoom & Recenter Controls matching the Screenshot             */
/* ------------------------------------------------------------------ */

function CustomFloatingControls({
  onRecenter,
  onFocusActive,
}: {
  onRecenter: () => void;
  onFocusActive: () => void;
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none">
      {/* Vertical pill: Zoom + / - / Locate */}
      <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomIn();
          }}
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors text-lg font-light active:bg-slate-100"
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-5 h-[1px] bg-slate-100" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomOut();
          }}
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors text-lg font-light active:bg-slate-100"
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
        <div className="w-5 h-[1px] bg-slate-100" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFocusActive();
          }}
          className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors active:bg-slate-100"
          title="Focus selected route"
          aria-label="Focus selected route"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>

      {/* Recenter button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRecenter();
        }}
        className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 text-[11px] font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all active:scale-95"
        title="Recenter all routes"
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
        Recenter
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bounds Controller                                                  */
/* ------------------------------------------------------------------ */

function MapBoundsController({
  routes,
  activeRoute,
  fitTrigger,
}: {
  routes: PlottableRoute[];
  activeRoute?: PlottableRoute;
  fitTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (routes.length === 0) return;
    const all = routes.flatMap((r) =>
      r.points.map((p) => [p.lat, p.lon] as [number, number]),
    );
    if (all.length < 2) return;
    map.fitBounds(L.latLngBounds(all), {
      padding: [48, 48],
      maxZoom: 8,
      animate: true,
    });
  }, [routes, fitTrigger, map]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Main OverviewMapInner Component                                     */
/* ------------------------------------------------------------------ */

export default function OverviewMapInner({
  routes,
  activeId: controlledActiveId,
  onSelectRoute,
}: {
  routes: PlottableRoute[];
  activeId?: string | null;
  onSelectRoute?: (id: string, rank: number) => void;
}) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    routes[0]?.entry.id ?? "",
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [fitCounter, setFitCounter] = useState(0);

  const activeId = controlledActiveId ?? internalActiveId;

  // Active route
  const activeRoute = useMemo(() => {
    return routes.find((r) => r.entry.id === activeId) ?? routes[0];
  }, [routes, activeId]);

  const mapRef = useRef<L.Map | null>(null);

  // Initial center
  const center = useMemo<[number, number]>(() => {
    const all = routes.flatMap((r) => r.points);
    if (all.length === 0) return [22.5, 79];
    return [
      all.reduce((s, p) => s + p.lat, 0) / all.length,
      all.reduce((s, p) => s + p.lon, 0) / all.length,
    ];
  }, [routes]);

  const handleSelect = useCallback(
    (id: string, rank: number) => {
      setInternalActiveId(id);
      onSelectRoute?.(id, rank);
    },
    [onSelectRoute],
  );

  const handleRecenter = useCallback(() => {
    if (!mapRef.current || routes.length === 0) return;
    const all = routes.flatMap((r) =>
      r.points.map((p) => [p.lat, p.lon] as [number, number]),
    );
    if (all.length < 2) return;
    mapRef.current.fitBounds(L.latLngBounds(all), {
      padding: [48, 48],
      maxZoom: 8,
      animate: true,
    });
  }, [routes]);

  const handleFocusActive = useCallback(() => {
    if (!mapRef.current || !activeRoute) return;
    const pts = activeRoute.points.map(
      (p) => [p.lat, p.lon] as [number, number],
    );
    if (pts.length < 2) return;
    mapRef.current.fitBounds(L.latLngBounds(pts), {
      padding: [56, 56],
      maxZoom: 9,
      animate: true,
    });
  }, [activeRoute]);

  if (routes.length === 0) return null;

  return (
    <div className="relative h-full w-full isolate overflow-hidden select-none bg-[#e8f4fc]">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        touchZoom={false}
        zoomControl={false}
        className="h-full w-full"
        ref={(m) => {
          if (m) mapRef.current = m;
        }}
      >
        {/* CartoDB Voyager Tile Layer — pristine pastel light-blue styling */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* 1. Inactive Routes (Dashed Lines + Midpoint Badges) */}
        {routes
          .filter((r) => r.entry.id !== activeId)
          .map((r) => {
            const path = r.points.map((p) => [p.lat, p.lon]) as [
              number,
              number,
            ][];
            const isHovered = hoveredId === r.entry.id;
            const mid = getPolylineMidpoint(r.points);

            // Color scheme matching reference:
            // Route 1 is blue/purple dashed, routes 3/4 are slate dashed
            const dashColor = r.entry.rank === 1 ? "#3b82f6" : "#94a3b8";

            return (
              <div key={r.entry.id} style={{ display: "contents" }}>
                {/* Wide invisible hitbox for easy mobile tap & desktop click */}
                <Polyline
                  positions={path}
                  pathOptions={{
                    color: "transparent",
                    weight: 24,
                    opacity: 0.001,
                  }}
                  eventHandlers={{
                    click: () => handleSelect(r.entry.id, r.entry.rank),
                    mouseover: () => setHoveredId(r.entry.id),
                    mouseout: () => setHoveredId(null),
                  }}
                />

                {/* Visible Dashed Line */}
                <Polyline
                  positions={path}
                  pathOptions={{
                    color: isHovered ? "#2563eb" : dashColor,
                    weight: isHovered ? 3.5 : 2.5,
                    dashArray: "6, 8",
                    opacity: isHovered ? 0.95 : 0.65,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                  eventHandlers={{
                    click: () => handleSelect(r.entry.id, r.entry.rank),
                    mouseover: () => setHoveredId(r.entry.id),
                    mouseout: () => setHoveredId(null),
                  }}
                />

                {/* Numbered Badge anchored along the line curve */}
                <Marker
                  position={mid}
                  icon={L.divIcon({
                    html: routeBadgeHtml(r.entry.rank, false),
                    className: "wv-icon-reset",
                    iconSize: [26, 26],
                    iconAnchor: [13, 13],
                  })}
                  eventHandlers={{
                    click: () => handleSelect(r.entry.id, r.entry.rank),
                    mouseover: () => setHoveredId(r.entry.id),
                    mouseout: () => setHoveredId(null),
                  }}
                />
              </div>
            );
          })}

        {/* 2. Active Route (Bold Solid Blue Line + Stations + Badges) */}
        {activeRoute && (
          <div
            key={`active-${activeRoute.entry.id}`}
            style={{ display: "contents" }}
          >
            {/* Active Polyline */}
            <Polyline
              positions={
                activeRoute.points.map((p) => [p.lat, p.lon]) as [
                  number,
                  number,
                ][]
              }
              pathOptions={{
                color: "#2563eb", // Royal blue
                weight: 4.5,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            {/* Active Route Badge at midpoint */}
            <Marker
              position={getPolylineMidpoint(activeRoute.points)}
              icon={L.divIcon({
                html: routeBadgeHtml(activeRoute.entry.rank, true),
                className: "wv-icon-reset",
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            />

            {/* Station Markers along Active Route */}
            {activeRoute.points.map((p, i) => {
              const isOrigin = i === 0;
              const isDest = i === activeRoute.points.length - 1;
              const cleanName = cleanStationName(p.name, p.code);

              let iconHtml = "";
              let iconSize: [number, number] = [12, 12];
              let iconAnchor: [number, number] = [6, 6];

              if (isOrigin) {
                iconHtml = originIconHtml(cleanName);
                iconSize = [24, 24];
                iconAnchor = [12, 12];
              } else if (isDest) {
                iconHtml = destIconHtml(cleanName);
                iconSize = [24, 24];
                iconAnchor = [12, 12];
              } else {
                iconHtml = intermediateStopHtml(cleanName);
                iconSize = [12, 12];
                iconAnchor = [6, 6];
              }

              return (
                <Marker
                  key={`active-stop-${p.code}-${i}`}
                  position={[p.lat, p.lon]}
                  icon={L.divIcon({
                    html: iconHtml,
                    className: "wv-icon-reset",
                    iconSize,
                    iconAnchor,
                  })}
                />
              );
            })}
          </div>
        )}

        {/* Floating Custom Map Controls */}
        <CustomFloatingControls
          onRecenter={handleRecenter}
          onFocusActive={handleFocusActive}
        />

        <MapBoundsController
          routes={routes}
          activeRoute={activeRoute}
          fitTrigger={fitCounter}
        />
      </MapContainer>

      {/* Floating Interactive Route Preview Card (Top-Right / Mobile Top) */}
      {activeRoute && (
        <div className="absolute top-3 right-3 left-3 sm:left-auto sm:max-w-[280px] z-[1000] pointer-events-auto rounded-2xl border border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-[10px] font-bold text-white shadow-xs">
                {activeRoute.entry.rank}
              </span>
              <span className="font-mono text-[11px] font-bold tracking-tight text-slate-900 uppercase">
                {activeRoute.entry.label}
              </span>
            </div>
            {activeRoute.entry.totalFare !== null && (
              <span className="font-mono text-[11px] font-bold text-slate-800">
                ₹{activeRoute.entry.totalFare}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>
              {Math.floor(activeRoute.entry.totalDurationMin / 60)}h{" "}
              {activeRoute.entry.totalDurationMin % 60}m
            </span>
            <span>
              {activeRoute.entry.connections === 0
                ? "Direct route"
                : `${activeRoute.entry.connections} connection${activeRoute.entry.connections > 1 ? "s" : ""}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleSelect(activeRoute.entry.id, activeRoute.entry.rank)
            }
            className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600/10 py-1.5 font-mono text-[11px] font-semibold text-blue-700 hover:bg-blue-600/20 active:scale-[0.98] transition-all"
          >
            View in list ↓
          </button>
        </div>
      )}

      {/* CSS Styles for Map Markers and Layout */}
      <style>{`
        .wv-icon-reset {
          background: transparent !important;
          border: none !important;
        }

        /* Marker Container */
        .wv-marker-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Origin double-ring marker */
        .wv-ring-origin {
          position: relative;
          width: 22px;
          height: 22px;
        }
        .wv-ring-origin-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          border: 2px solid #2563eb;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.35);
        }
        .wv-ring-origin-inner {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid #ffffff;
        }

        /* Destination double-ring marker */
        .wv-ring-dest {
          position: relative;
          width: 22px;
          height: 22px;
        }
        .wv-ring-dest-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.25);
          border: 2.5px solid #8b5cf6;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.35);
        }
        .wv-ring-dest-inner {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: #8b5cf6;
          border: 2px solid #ffffff;
        }

        /* Intermediate hollow stop ring */
        .wv-ring-stop {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #2563eb;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }

        /* Station Text Labels */
        .wv-station-label {
          position: absolute;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #1e293b;
          white-space: nowrap;
          pointer-events: none;
          text-shadow:
            -1.5px -1.5px 0 #fff,  
             1.5px -1.5px 0 #fff,
            -1.5px  1.5px 0 #fff,
             1.5px  1.5px 0 #fff,
             0 0 5px #fff,
             0 0 8px #fff;
        }
        .wv-label-top {
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
        }
        .wv-label-bottom {
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
        }
        .wv-label-right {
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Numbered Route Badges on curves */
        .wv-badge-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .wv-route-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wv-badge-wrap:hover .wv-route-badge,
        .wv-badge-wrap.wv-badge-active .wv-route-badge {
          transform: scale(1.18);
          box-shadow: 0 3px 10px rgba(37, 99, 235, 0.5);
        }

        .leaflet-container {
          background: #e8f4fc;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
