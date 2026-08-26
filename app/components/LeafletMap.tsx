"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
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

function divIcon(html: string, size: [number, number], anchor: [number, number]) {
  return L.divIcon({ html, className: "wv-icon-reset", iconSize: size, iconAnchor: anchor });
}

function pinIconHtml(color: string) {
  return `
    <div class="wv-pin-wrap">
      <span class="wv-pin-pulse" style="background:${color}"></span>
      <span class="wv-pin" style="background:${color}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
          <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="12" cy="9.5" r="2.2" stroke="white" stroke-width="2"/>
        </svg>
      </span>
    </div>`;
}

function junctionIconHtml() {
  return `
    <div class="wv-junction">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
        <path d="M12 3v6M12 15v6M6 9l6 3 6-3M6 15l6-3 6 3" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`;
}

function trainIconHtml() {
  return `
    <div class="wv-train">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <rect x="5" y="4" width="14" height="12" rx="3" stroke="white" stroke-width="2"/>
        <path d="M5 11h14M9 4v12M15 4v12" stroke="white" stroke-width="1.6"/>
        <circle cx="8.5" cy="19" r="1.2" fill="white"/>
        <circle cx="15.5" cy="19" r="1.2" fill="white"/>
      </svg>
    </div>`;
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
  }, [points, map]);
  return null;
}

/** Glides a train marker leg-by-leg along the real route, looping continuously. */
function AnimatedTrain({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (points.length < 2) return;
    const icon = divIcon(trainIconHtml(), [26, 26], [13, 13]);
    const marker = L.marker([points[0].lat, points[0].lon], { icon, zIndexOffset: 1000, interactive: false }).addTo(map);
    markerRef.current = marker;

    let raf = 0;
    let leg = 0;
    let t0 = performance.now();
    const legDurationMs = 2400;
    const pauseMs = 500;
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
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      marker.setLatLng([a.lat + (b.lat - a.lat) * eased, a.lon + (b.lon - a.lon) * eased]);

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
  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [22.5, 79];
    return [points.reduce((s, p) => s + p.lat, 0) / points.length, points.reduce((s, p) => s + p.lon, 0) / points.length];
  }, [points]);

  if (points.length < 2) return null;

  const path = points.map((p) => [p.lat, p.lon]) as [number, number][];

  return (
    <div className="relative isolate h-[360px] w-full overflow-hidden">
      <MapContainer center={center} zoom={6} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={path} pathOptions={{ color: "#7c5cff", weight: 3, opacity: 0.3 }} />
        <Polyline positions={path} pathOptions={{ color: "#7c5cff", weight: 3, dashArray: "1 10", className: "wv-flow-line" }} />

        {points.map((p, i) => (
          <Marker
            key={`${p.code}-${i}`}
            position={[p.lat, p.lon]}
            icon={
              p.kind === "junction"
                ? divIcon(junctionIconHtml(), [24, 24], [12, 12])
                : divIcon(pinIconHtml(p.kind === "origin" ? "#16a34a" : "#7c5cff"), [30, 38], [15, 36])
            }
          />
        ))}

        <AnimatedTrain points={points} />
        <FitBounds points={points} />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-1.5">
        {points.map((p, i) => (
          <span
            key={`${p.code}-lbl-${i}`}
            className="rounded-full border border-white/60 bg-white/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink shadow-sm backdrop-blur"
          >
            {p.code}
          </span>
        ))}
      </div>

      <style>{`
        .wv-icon-reset { background: transparent; border: none; }
        .wv-pin-wrap { position: relative; width: 30px; height: 38px; }
        .wv-pin {
          position: absolute; left: 50%; top: 0;
          width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
          display: flex; align-items: center; justify-content: center;
          transform: translateX(-50%) rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }
        .wv-pin svg { transform: rotate(45deg); }
        .wv-pin-pulse {
          position: absolute; left: 50%; top: 11px; transform: translate(-50%, -50%);
          width: 14px; height: 14px; border-radius: 50%; opacity: 0.55;
          animation: wvPulse 1.8s ease-out infinite;
        }
        @keyframes wvPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(3.4); opacity: 0; }
        }
        .wv-junction {
          width: 22px; height: 22px; border-radius: 50%;
          background: #6b7280; display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .wv-train {
          width: 24px; height: 24px; border-radius: 50%;
          background: #7c5cff; display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 2px 8px rgba(124,92,255,0.6);
        }
        .wv-flow-line path { animation: wvDash 1s linear infinite; }
        @keyframes wvDash { to { stroke-dashoffset: -22; } }
        .leaflet-container { background: #eef1f8; font-family: inherit; }
      `}</style>
    </div>
  );
}