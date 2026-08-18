"use client";

import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

export interface MapPoint {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

function stationIcon(kind: "start" | "end" | "mid") {
  const size = kind === "mid" ? 12 : 16;
  const bg = kind === "mid" ? "#ffffff" : "#7c3aed";
  const border = "#7c3aed";
  const inner = kind === "mid" ? `<span style="width:5px;height:5px;border-radius:999px;background:${border};display:block;margin:auto;"></span>` : "";
  return L.divIcon({
    className: "wayvia-station-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${bg};border:2.5px solid ${border};box-shadow:0 1px 4px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">${inner}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 6);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, points]);
  return null;
}

export default function LeafletMap({ points }: { points: MapPoint[] }) {
  const center: [number, number] = points.length
    ? [points[Math.floor(points.length / 2)].lat, points[Math.floor(points.length / 2)].lon]
    : [22.5, 80];

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom={false} style={{ height: "340px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline
        positions={points.map((p) => [p.lat, p.lon])}
        pathOptions={{ color: "#7c3aed", weight: 3.5, opacity: 0.85, dashArray: "1 8", lineCap: "round" }}
      />

      {points.map((p, i) => {
        const kind = i === 0 || i === points.length - 1 ? (i === 0 ? "start" : "end") : "mid";
        return (
          <Marker key={`${p.code}-${i}`} position={[p.lat, p.lon]} icon={stationIcon(kind)}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={points.length <= 4}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>{p.code}</span>
            </Tooltip>
          </Marker>
        );
      })}

      <FitBounds points={points} />
    </MapContainer>
  );
}
