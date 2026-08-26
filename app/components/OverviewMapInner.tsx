"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapOverviewEntry, RouteStop } from "../types";

interface PlottableRoute {
  entry: MapOverviewEntry;
  points: (RouteStop & { lat: number; lon: number })[];
}

const HEADLINE_LABELS = new Set(["BEST MATCH", "CHEAPEST", "FASTEST"]);
/** Only this route's stops get always-on label cards, matching the screenshot — everything else labels on hover only. */
const ALWAYS_LABEL_LABEL = "BEST MATCH";

const MODE_ICON: Record<string, string> = {
  train: `<path d="M4 15.5V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v8.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 15.5Z"/><path d="M4 11h12"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="12.5" cy="14.5" r="1"/><path d="m7 20-1.5 2M13 20l1.5 2"/>`,
  bus: `<path d="M4 16V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10"/><path d="M4 12h12M4 16h12"/><circle cx="7" cy="18.5" r="1.3"/><circle cx="13" cy="18.5" r="1.3"/><path d="M6 4v2M14 4v2"/>`,
  flight: `<path d="M10 3.5 3 10l3 .5 2-1.5v4l-2 1.5v1.5l3.5-1L13 17l1-.5-1-6 6-3.5V5l-6 2-1.5-3.5Z"/>`,
};

/** xmlns is required — without it, some browsers silently refuse to parse an <svg> string set via innerHTML on a plain <div>, which is why icons weren't showing before. */
function modeIconSvg(mode: string | undefined) {
  const path = mode ? MODE_ICON[mode] : null;
  if (!path) return "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 22" width="14" height="14" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function pinEl(html: string, size: number, background: string, ring = true) {
  const el = document.createElement("div");
  el.className = "wv-ov-pin";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.background = background;
  if (!ring) el.style.border = "none";
  el.innerHTML = html;
  return el;
}

function labelEl(name: string, time: string) {
  const el = document.createElement("div");
  el.className = "wv-ov-label";
  el.innerHTML = `<span class="wv-ov-label-name">${name}</span><span class="wv-ov-label-time">${time}</span>`;
  return el;
}

/** Catmull-Rom spline through the waypoints, upsampled into a dense point list, so the
 *  drawn line reads as a smooth route instead of a ruler-straight polyline between 3-4 stops.
 *  This is a cosmetic curve, not real track geometry — there's no rail-corridor data in the
 *  API response to snap to. */
function smoothPath(points: [number, number][], segmentsPerSpan = 16): [number, number][] {
  if (points.length < 3) return points;
  const pts = [points[0], ...points, points[points.length - 1]];
  const out: [number, number][] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2];
    for (let t = 0; t < segmentsPerSpan; t++) {
      const s = t / segmentsPerSpan;
      const s2 = s * s;
      const s3 = s2 * s;
      const x =
        0.5 *
        (2 * x1 + (-x0 + x2) * s + (2 * x0 - 5 * x1 + 4 * x2 - x3) * s2 + (-x0 + 3 * x1 - 3 * x2 + x3) * s3);
      const y =
        0.5 *
        (2 * y1 + (-y0 + y2) * s + (2 * y0 - 5 * y1 + 4 * y2 - y3) * s2 + (-y0 + 3 * y1 - 3 * y2 + y3) * s3);
      out.push([x, y]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Guaranteed light/white basemap via raster tiles — no dependency on an external vector
 *  style JSON that can fail to load or fall back to a different (terrain-tinted) style. */
const LIGHT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
    },
  },
  layers: [{ id: "carto-light-layer", type: "raster", source: "carto-light" }],
};

export default function OverviewMapInner({ routes }: { routes: PlottableRoute[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: LIGHT_STYLE,
      center: [79, 22.5],
      zoom: 4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      "top-left"
    );
    map.scrollZoom.disable();
    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const bounds = useMemo(() => {
    const all = routes.flatMap((r) => r.points.map((p) => [p.lon, p.lat] as [number, number]));
    if (all.length < 2) return null;
    const b = new maplibregl.LngLatBounds(all[0], all[0]);
    all.forEach((p) => b.extend(p));
    return b;
  }, [routes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    routes.forEach((r) => {
      const sourceId = `wv-line-${r.entry.id}`;
      const isHeadline = HEADLINE_LABELS.has(r.entry.label);
      const dimmed = activeId !== null && activeId !== r.entry.id;
      const curved = smoothPath(r.points.map((p) => [p.lon, p.lat]));
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: curved },
      };

      const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
      } else {
        map.addSource(sourceId, { type: "geojson", data: geojson });
        map.addLayer({
          id: sourceId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": r.entry.color,
            "line-width": activeId === r.entry.id ? 5 : isHeadline ? 3.5 : 2.5,
            "line-opacity": dimmed ? 0.18 : isHeadline ? 0.9 : 0.6,
            "line-dasharray": isHeadline ? [1, 0] : [2, 1.6],
          },
        });
        map.on("mouseenter", sourceId, () => setActiveId(r.entry.id));
        map.on("mouseleave", sourceId, () => setActiveId(null));
      }
      map.setPaintProperty(sourceId, "line-width", activeId === r.entry.id ? 5 : isHeadline ? 3.5 : 2.5);
      map.setPaintProperty(sourceId, "line-opacity", dimmed ? 0.18 : isHeadline ? 0.9 : 0.6);

      const alwaysLabel = r.entry.label === ALWAYS_LABEL_LABEL;
      const showLabels = alwaysLabel || activeId === r.entry.id;

      r.points.forEach((p, i) => {
        const isOrigin = i === 0;
        const isDest = i === r.points.length - 1;

        const el = isOrigin
          ? pinEl(`<span class="wv-ov-pin-num">${r.entry.rank}</span>`, 28, r.entry.color)
          : isDest
          ? pinEl(`<span class="wv-ov-pin-num">${r.entry.rank}</span>`, 28, r.entry.color)
          : pinEl(modeIconSvg(p.arrivingMode), 24, r.entry.color);

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lon, p.lat])
          .addTo(map);
        el.addEventListener("mouseenter", () => setActiveId(r.entry.id));
        el.addEventListener("mouseleave", () => setActiveId(null));
        markersRef.current.push(marker);

        if (showLabels) {
          const lbl = labelEl(p.name, p.time);
          const labelMarker = new maplibregl.Marker({ element: lbl, anchor: "left", offset: [16, 0] })
            .setLngLat([p.lon, p.lat])
            .addTo(map);
          markersRef.current.push(labelMarker);
        }
      });
    });
  }, [routes, activeId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !bounds) return;
    map.fitBounds(bounds, { padding: 56, maxZoom: 8, duration: 0 });
  }, [ready, bounds]);

  if (routes.length === 0) return null;

  const headlineEntries = routes.filter((r) => HEADLINE_LABELS.has(r.entry.label));
  const hasOtherOptions = routes.some((r) => !HEADLINE_LABELS.has(r.entry.label));

  return (
    <div className="relative h-[420px] w-full overflow-visible">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex flex-col gap-1.5 rounded-lg border border-white/60 bg-white/95 p-2.5 shadow-sm backdrop-blur">
        {headlineEntries.map((r) => (
          <div key={r.entry.id} className="flex items-center gap-2">
            <span className="h-[2.5px] w-5 rounded-full" style={{ background: r.entry.color }} />
            <span className="font-mono text-[10.5px] font-medium text-ink">
              {r.entry.label.charAt(0) + r.entry.label.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
        {hasOtherOptions && (
          <div className="flex items-center gap-2">
            <span
              className="h-[2px] w-5 rounded-full"
              style={{ background: "repeating-linear-gradient(90deg,#9aa3b2 0 4px,transparent 4px 6px)" }}
            />
            <span className="font-mono text-[10.5px] font-medium text-ink-dim">Other options</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        /* Defensive overrides — several app-level CSS resets can otherwise push
           marker elements under the map canvas, which is why the rank numbers
           were getting clipped/hidden. */
        .maplibregl-marker {
          z-index: 50 !important;
        }
        .maplibregl-canvas {
          z-index: 1 !important;
        }
        .wv-ov-pin {
          position: relative;
          z-index: 50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }
        .wv-ov-pin-num {
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: white;
          line-height: 1;
        }
        .wv-ov-label {
          position: relative;
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 5px 9px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          pointer-events: none;
        }
        .wv-ov-label-name {
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 600;
          color: #14151a;
        }
        .wv-ov-label-time {
          font-family: inherit;
          font-size: 10px;
          color: #8a8f9c;
        }
        .maplibregl-ctrl-top-left {
          top: 8px;
          left: 8px;
          z-index: 20;
        }
        .maplibregl-ctrl-group {
          border-radius: 10px !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-bottom-right,
        .maplibregl-ctrl-bottom-left {
          z-index: 5;
        }
      `}</style>
    </div>
  );
}

export type { PlottableRoute };