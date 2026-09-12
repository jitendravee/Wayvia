"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  code: string;
  name: string;
  lat: number;
  lon: number;
  kind: "origin" | "junction" | "destination";
  meta?: string;
}

function cleanStationName(name: string, code: string): string {
  if (!name || name === code) return code;
  return name
    .replace(/\b(JN|JUNCTION|TERMINUS|TERMINAL|CANTT|CENTRAL|MAIN)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* HTML Markers matching the Reference Design                          */
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

function trainMarkerHtml() {
  return `
    <div class="wv-train-pill">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3" width="16" height="15" rx="3" />
        <path d="M4 11h16M8 3v8M16 3v8" />
        <circle cx="8" cy="15" r="1" fill="currentColor" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
      </svg>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Custom Zoom & Recenter Controls                                    */
/* ------------------------------------------------------------------ */

function CustomFloatingControls({ onRecenter }: { onRecenter: () => void }) {
  const map = useMap();

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none">
      <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomIn();
          }}
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors text-lg font-light active:bg-slate-100"
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
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors text-lg font-light active:bg-slate-100"
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
            onRecenter();
          }}
          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors active:bg-slate-100"
          title="Recenter route"
          aria-label="Recenter route"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRecenter();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 text-[10.5px] font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all active:scale-95"
        title="Recenter route"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
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

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lon] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
  }, [points, map]);
  return null;
}

/** Glides a modern train badge leg-by-leg along the route */
function AnimatedTrain({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (points.length < 2) return;
    const icon = L.divIcon({
      html: trainMarkerHtml(),
      className: "wv-icon-reset",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const marker = L.marker([points[0].lat, points[0].lon], {
      icon,
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);
    markerRef.current = marker;

    let raf = 0;
    let leg = 0;
    let t0 = performance.now();
    const legDurationMs = 2800;
    const pauseMs = 600;
    let pausing = false;

    function frame(now: number) {
      const a = points[leg];
      const b = points[leg + 1];
      if (!a || !b) return;

      if (pausing) {
        if (now - t0 >= pauseMs) {
          pausing = false;
          t0 = now;
        }
        raf = requestAnimationFrame(frame);
        return;
      }

      const progress = Math.min(1, (now - t0) / legDurationMs);
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      marker.setLatLng([
        a.lat + (b.lat - a.lat) * eased,
        a.lon + (b.lon - a.lon) * eased,
      ]);

      if (progress >= 1) {
        leg = (leg + 1) % (points.length - 1);
        pausing = true;
        t0 = now;
        if (leg === 0) marker.setLatLng([points[0].lat, points[0].lon]);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      marker.remove();
    };
  }, [points, map]);

  return null;
}

export default function LeafletMap({ points }: { points: MapPoint[] }) {
  const mapRef = useRef<L.Map | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [22.5, 79];
    return [
      points.reduce((s, p) => s + p.lat, 0) / points.length,
      points.reduce((s, p) => s + p.lon, 0) / points.length,
    ];
  }, [points]);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current || points.length < 2) return;
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lon] as [number, number]),
    );
    mapRef.current.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 9,
      animate: true,
    });
  }, [points]);

  if (points.length < 2) return null;

  const path = points.map((p) => [p.lat, p.lon]) as [number, number][];

  return (
    <div className="relative isolate h-[360px] w-full overflow-hidden select-none bg-[#e8f4fc]">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        touchZoom={false}
        zoomControl={false}
        className="h-full w-full"
        ref={(m) => {
          if (m) mapRef.current = m;
        }}
      >
        {/* CartoDB Voyager clean pastel tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Outer subtle glow line */}
        <Polyline
          positions={path}
          pathOptions={{
            color: "#93c5fd",
            weight: 8,
            opacity: 0.45,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Solid royal blue route polyline matching screenshot */}
        <Polyline
          positions={path}
          pathOptions={{
            color: "#2563eb",
            weight: 4.5,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Stations along the route */}
        {points.map((p, i) => {
          const isOrigin = p.kind === "origin";
          const isDest = p.kind === "destination";
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
              key={`${p.code}-${i}`}
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

        <AnimatedTrain points={points} />
        <FitBounds points={points} />
        <CustomFloatingControls onRecenter={handleRecenter} />
      </MapContainer>

      {/* CSS Styles */}
      <style>{`
        .wv-icon-reset {
          background: transparent !important;
          border: none !important;
        }

        .wv-marker-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Origin double-ring */
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

        /* Destination double-ring */
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

        /* Intermediate hollow ring */
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

        /* Train Pill */
        .wv-train-pill {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
        }

        .leaflet-container {
          background: #e8f4fc;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
