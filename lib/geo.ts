import { DEFAULT_HUBS } from "./graph/hubs";

/**
 * Server-side station coordinate directory. This is what lets the API
 * attach lat/lon to every stop in a journey (see lib/availability.ts and
 * lib/mapOverview.ts) so the frontend can draw the "big picture" route map
 * — like the multi-route overview map with numbered pins — without doing
 * its own per-station geocoding on every request. RouteMap.tsx still keeps
 * a client-side Nominatim fallback for the rare station this list doesn't
 * cover, but for every curated station (the ones journeys are actually
 * built through — origins, destinations, and hub junctions) coordinates
 * now come back with the search response itself.
 *
 * Deliberately separate from lib/graph/hubs.ts's `DEFAULT_HUBS`: that list
 * exists to drive hub *discovery* (which junctions are worth querying),
 * this one exists purely to answer "where is station X" for any station
 * code that shows up in a leg, hub-discovery-relevant or not. They're
 * merged below so every hub is automatically geocodable too.
 */
export interface StationCoord {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

/**
 * Common origin/destination + interchange stations that aren't already in
 * DEFAULT_HUBS's junction-focused list — kept here rather than adding
 * lat/lon to lib/stations.ts's EXTRA_STATIONS so that file (which is about
 * search-box display names) doesn't have to also own map coordinates.
 */
const EXTRA_COORDS: StationCoord[] = [
  { code: "BCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "CSMT", name: "Mumbai CSMT", lat: 18.94, lon: 72.84 },
  { code: "BDTS", name: "Bandra Terminus", lat: 19.06, lon: 72.84 },
  { code: "MMCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "DDR", name: "Dadar", lat: 19.02, lon: 72.84 },
  { code: "PUNE", name: "Pune Jn", lat: 18.53, lon: 73.87 },
  { code: "SBC", name: "Bengaluru City (KSR)", lat: 12.98, lon: 77.57 },
  { code: "MAS", name: "Chennai Central", lat: 13.08, lon: 80.28 },
  { code: "HWH", name: "Howrah Jn", lat: 22.58, lon: 88.34 },
  { code: "SC", name: "Secunderabad Jn", lat: 17.43, lon: 78.5 },
  { code: "ADI", name: "Ahmedabad Jn", lat: 23.03, lon: 72.6 },
  { code: "PNBE", name: "Patna Jn", lat: 25.61, lon: 85.14 },
  { code: "BBS", name: "Bhubaneswar", lat: 20.27, lon: 85.83 },
  { code: "GHY", name: "Guwahati", lat: 26.18, lon: 91.75 },
  { code: "TVC", name: "Thiruvananthapuram Central", lat: 8.49, lon: 76.95 },
  { code: "ERS", name: "Ernakulam Jn", lat: 9.98, lon: 76.29 },
  { code: "MAO", name: "Madgaon, Goa", lat: 15.27, lon: 73.96 },
  { code: "UDZ", name: "Udaipur City", lat: 24.58, lon: 73.68 },
  { code: "NGP", name: "Nagpur Jn", lat: 21.15, lon: 79.09 },
  { code: "VSKP", name: "Visakhapatnam", lat: 17.72, lon: 83.3 },
  { code: "TPTY", name: "Tirupati", lat: 13.63, lon: 79.42 },
  { code: "MYS", name: "Mysuru Jn", lat: 12.31, lon: 76.65 },
  { code: "CBE", name: "Coimbatore Jn", lat: 11.0, lon: 76.96 },
  { code: "MDU", name: "Madurai Jn", lat: 9.92, lon: 78.12 },
  { code: "PNVL", name: "Panvel", lat: 18.99, lon: 73.12 },
  { code: "VR", name: "Vasai Road Jn", lat: 19.4, lon: 72.83 },
  { code: "BSR", name: "Vasai Road", lat: 19.4, lon: 72.83 },
  { code: "TNA", name: "Thane", lat: 19.19, lon: 72.97 },
  { code: "KYN", name: "Kalyan Jn", lat: 19.24, lon: 73.13 },
  { code: "BVI", name: "Borivali", lat: 19.23, lon: 72.86 },
  { code: "LTT", name: "Lokmanya Tilak Terminus", lat: 19.08, lon: 72.89 },
  { code: "LNL", name: "Lonavala", lat: 18.75, lon: 73.41 },
  { code: "KJT", name: "Karjat", lat: 18.91, lon: 73.32 },
  { code: "CCH", name: "Chinchwad", lat: 18.65, lon: 73.8 },
  { code: "MMR", name: "Manmad Jn", lat: 20.25, lon: 74.44 },
  { code: "BIRD", name: "Bhivandi Road", lat: 19.28, lon: 73.06 },
  { code: "VAPI", name: "Vapi", lat: 20.37, lon: 72.91 },
  { code: "BL", name: "Valsad", lat: 20.6, lon: 72.93 },
  { code: "CYI", name: "Chandlodiya", lat: 23.09, lon: 72.58 },
];

const COORD_MAP: Map<string, StationCoord> = (() => {
  const m = new Map<string, StationCoord>();
  for (const h of DEFAULT_HUBS) m.set(h.code, { code: h.code, name: h.name, lat: h.lat, lon: h.lon });
  for (const s of EXTRA_COORDS) m.set(s.code, s); // extra entries win — more precise city-station coords
  return m;
})();

/** Looks up known lat/lon for a station code. Returns null if this station isn't in the curated coordinate directory (the frontend's RouteMap falls back to live geocoding in that case). */
export function getStationCoord(code: string): StationCoord | null {
  return COORD_MAP.get(code.toUpperCase()) ?? null;
}

/** Registers/overrides a coordinate at runtime — used so mock bus/flight stops that use real station codes stay resolvable even if a new code shows up that isn't curated yet. */
export function registerStationCoord(coord: StationCoord): void {
  if (!COORD_MAP.has(coord.code)) COORD_MAP.set(coord.code, coord);
}
