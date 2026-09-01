/**
 * Candidate transfer/hub stations, plus a relevance scorer.
 *
 * erail.in doesn't give us a bulk "all stations + connectivity" dump the
 * way a downloaded government timetable would, so instead of pre-building
 * a full graph we query outward from a curated list of major junctions,
 * live, on demand, per search. This list is the fast, zero-network-cost
 * first tier — it covers the big, well-connected junctions across every
 * zone and has known coordinates, so `scoreHub` can rank it geographically
 * before any erail.in request is made.
 *
 * It's no longer the *only* tier. Two more hub sources get merged in
 * alongside this one (see lib/graph/discover.ts):
 *   - lib/erail/stationDirectory.ts's live + discovered station list, so
 *     the "junctions to explore" pool isn't capped at this file's length.
 *   - lib/graph/dynamicHubs.ts, which derives extra hub candidates from the
 *     *real* intermediate stops of actual trains via getRoute(), for when
 *     this geo list + the live directory still come up thin.
 */
export interface Hub {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export const DEFAULT_HUBS: Hub[] = [
  // ---- Northern (Delhi / UP / Punjab / Haryana / Rajasthan / Uttarakhand) ----
  { code: "NDLS", name: "New Delhi", lat: 28.64, lon: 77.22 },
  { code: "DLI", name: "Delhi Jn (Old Delhi)", lat: 28.66, lon: 77.23 },
  { code: "NZM", name: "Hazrat Nizamuddin", lat: 28.59, lon: 77.25 },
  { code: "ANVT", name: "Anand Vihar Terminal", lat: 28.65, lon: 77.32 },
  { code: "CNB", name: "Kanpur Central", lat: 26.45, lon: 80.35 },
  { code: "LKO", name: "Lucknow Charbagh", lat: 26.83, lon: 80.92 },
  { code: "ALD", name: "Prayagraj Jn (Allahabad)", lat: 25.45, lon: 81.83 },
  { code: "GKP", name: "Gorakhpur Jn", lat: 26.76, lon: 83.37 },
  { code: "BSB", name: "Varanasi Jn", lat: 25.33, lon: 82.99 },
  { code: "MGS", name: "Mughalsarai (DDU)", lat: 25.28, lon: 83.13 },
  { code: "MB", name: "Moradabad Jn", lat: 28.84, lon: 78.78 },
  { code: "BE", name: "Bareilly Jn", lat: 28.35, lon: 79.4 },
  { code: "UMB", name: "Ambala Cantt Jn", lat: 30.35, lon: 76.82 },
  { code: "LDH", name: "Ludhiana Jn", lat: 30.9, lon: 75.85 },
  { code: "ASR", name: "Amritsar Jn", lat: 31.63, lon: 74.87 },
  { code: "PTK", name: "Pathankot Jn", lat: 32.27, lon: 75.65 },
  { code: "CDG", name: "Chandigarh", lat: 30.71, lon: 76.8 },
  { code: "HW", name: "Haridwar Jn", lat: 29.94, lon: 78.16 },
  { code: "DDN", name: "Dehradun", lat: 30.32, lon: 78.03 },
  { code: "JP", name: "Jaipur Jn", lat: 26.92, lon: 75.79 },
  { code: "JU", name: "Jodhpur Jn", lat: 26.28, lon: 73.02 },
  { code: "BKN", name: "Bikaner Jn", lat: 28.01, lon: 73.31 },
  { code: "KOTA", name: "Kota Jn", lat: 25.18, lon: 75.85 },
  { code: "AII", name: "Ajmer Jn", lat: 26.45, lon: 74.64 },

  // ---- Central / Western (MP / Gujarat / Maharashtra) ----
  { code: "BPL", name: "Bhopal Jn", lat: 23.26, lon: 77.4 },
  { code: "JBP", name: "Jabalpur Jn", lat: 23.16, lon: 79.95 },
  { code: "ET", name: "Itarsi Jn", lat: 22.61, lon: 77.76 },
  { code: "UJN", name: "Ujjain Jn", lat: 23.18, lon: 75.78 },
  { code: "INDB", name: "Indore Jn", lat: 22.72, lon: 75.87 },
  { code: "RTM", name: "Ratlam Jn", lat: 23.33, lon: 75.04 },
  { code: "NGP", name: "Nagpur Jn", lat: 21.15, lon: 79.09 },
  { code: "BSL", name: "Bhusaval Jn", lat: 21.04, lon: 75.78 },
  { code: "MMR", name: "Manmad Jn", lat: 20.25, lon: 74.44 },
  { code: "AWB", name: "Aurangabad", lat: 19.88, lon: 75.34 },
  { code: "NED", name: "Nanded", lat: 19.15, lon: 77.32 },
  { code: "SUR", name: "Solapur Jn", lat: 17.66, lon: 75.91 },
  { code: "MRJ", name: "Miraj Jn", lat: 16.83, lon: 74.64 },
  { code: "KOP", name: "Kolhapur (Chhatrapati Shahu Maharaj Terminus)", lat: 16.7, lon: 74.24 },
  { code: "PUNE", name: "Pune Jn", lat: 18.53, lon: 73.87 },
  { code: "DD", name: "Daund Jn", lat: 18.46, lon: 74.58 },
  { code: "LNL", name: "Lonavala", lat: 18.75, lon: 73.41 },
  { code: "BCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "MMCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "CSMT", name: "Mumbai CSMT", lat: 18.94, lon: 72.84 },
  { code: "LTT", name: "Lokmanya Tilak Terminus", lat: 19.07, lon: 72.89 },
  { code: "DR", name: "Dadar", lat: 19.02, lon: 72.84 },
  { code: "TNA", name: "Thane", lat: 19.19, lon: 72.97 },
  { code: "KYN", name: "Kalyan Jn", lat: 19.24, lon: 73.13 },
  { code: "PNVL", name: "Panvel", lat: 18.99, lon: 73.12 },
  { code: "BVI", name: "Borivali", lat: 19.23, lon: 72.86 },
  { code: "VR", name: "Vasai Road Jn", lat: 19.4, lon: 72.83 },
  { code: "ST", name: "Surat", lat: 21.17, lon: 72.83 },
  { code: "BRC", name: "Vadodara Jn", lat: 22.31, lon: 73.18 },
  { code: "ADI", name: "Ahmedabad Jn", lat: 23.03, lon: 72.6 },
  { code: "RJT", name: "Rajkot Jn", lat: 22.29, lon: 70.79 },
  { code: "MAO", name: "Madgaon", lat: 15.38, lon: 73.96 },

  // ---- Eastern (Bihar / WB / Jharkhand / Odisha) ----
  { code: "PNBE", name: "Patna Jn", lat: 25.61, lon: 85.14 },
  { code: "RJPB", name: "Rajendra Nagar Terminal", lat: 25.6, lon: 85.16 },
  { code: "DNR", name: "Danapur", lat: 25.63, lon: 85.05 },
  { code: "MFP", name: "Muzaffarpur Jn", lat: 26.12, lon: 85.39 },
  { code: "DBG", name: "Darbhanga Jn", lat: 26.15, lon: 85.9 },
  { code: "GAYA", name: "Gaya Jn", lat: 24.8, lon: 85.0 },
  { code: "CPR", name: "Chhapra Jn", lat: 25.78, lon: 84.73 },
  { code: "KIR", name: "Katihar Jn", lat: 25.53, lon: 87.58 },
  { code: "NJP", name: "New Jalpaiguri", lat: 26.7, lon: 88.43 },
  { code: "HWH", name: "Howrah Jn", lat: 22.58, lon: 88.34 },
  { code: "SDAH", name: "Sealdah", lat: 22.57, lon: 88.37 },
  { code: "KGP", name: "Kharagpur Jn", lat: 22.35, lon: 87.32 },
  { code: "ASN", name: "Asansol Jn", lat: 23.68, lon: 86.99 },
  { code: "DHN", name: "Dhanbad Jn", lat: 23.8, lon: 86.43 },
  { code: "TATA", name: "Tatanagar Jn", lat: 22.8, lon: 86.19 },
  { code: "RNC", name: "Ranchi Jn", lat: 23.37, lon: 85.33 },
  { code: "BBS", name: "Bhubaneswar", lat: 20.27, lon: 85.84 },
  { code: "PURI", name: "Puri", lat: 19.81, lon: 85.83 },
  { code: "CTC", name: "Cuttack Jn", lat: 20.47, lon: 85.88 },
  { code: "KUR", name: "Khurda Road Jn", lat: 20.18, lon: 85.62 },
  { code: "BAM", name: "Brahmapur", lat: 19.32, lon: 84.79 },
  { code: "SBP", name: "Sambalpur Jn", lat: 21.47, lon: 83.98 },
  { code: "R", name: "Raipur Jn", lat: 21.24, lon: 81.63 },
  { code: "BSP", name: "Bilaspur Jn", lat: 22.09, lon: 82.15 },
  { code: "G", name: "Gondia Jn", lat: 21.46, lon: 80.2 },
  { code: "GHY", name: "Guwahati", lat: 26.18, lon: 91.75 },
  { code: "NJP", name: "New Jalpaiguri", lat: 26.7, lon: 88.43 },

  // ---- Southern (Karnataka / TN / Kerala / Andhra / Telangana) ----
  { code: "SC", name: "Secunderabad Jn", lat: 17.43, lon: 78.5 },
  { code: "HYB", name: "Hyderabad Deccan (Nampally)", lat: 17.39, lon: 78.47 },
  { code: "KCG", name: "Kacheguda", lat: 17.38, lon: 78.5 },
  { code: "BZA", name: "Vijayawada Jn", lat: 16.51, lon: 80.63 },
  { code: "GNT", name: "Guntur Jn", lat: 16.3, lon: 80.44 },
  { code: "VSKP", name: "Visakhapatnam", lat: 17.72, lon: 83.3 },
  { code: "RJY", name: "Rajahmundry", lat: 17.0, lon: 81.78 },
  { code: "GTL", name: "Guntakal Jn", lat: 15.17, lon: 77.37 },
  { code: "TPTY", name: "Tirupati", lat: 13.63, lon: 79.42 },
  { code: "RU", name: "Renigunta Jn", lat: 13.65, lon: 79.51 },
  { code: "NLR", name: "Nellore", lat: 14.44, lon: 79.99 },
  { code: "SBC", name: "Bengaluru City (KSR)", lat: 12.98, lon: 77.57 },
  { code: "YPR", name: "Yesvantpur Jn", lat: 13.03, lon: 77.54 },
  { code: "KJM", name: "Bengaluru Cantt", lat: 12.99, lon: 77.6 },
  { code: "MYS", name: "Mysuru Jn", lat: 12.31, lon: 76.65 },
  { code: "UBL", name: "Hubballi Jn", lat: 15.35, lon: 75.13 },
  { code: "MAS", name: "Chennai Central", lat: 13.08, lon: 80.28 },
  { code: "MS", name: "Chennai Egmore", lat: 13.08, lon: 80.26 },
  { code: "CBE", name: "Coimbatore Jn", lat: 11.0, lon: 76.96 },
  { code: "SA", name: "Salem Jn", lat: 11.66, lon: 78.15 },
  { code: "TPJ", name: "Tiruchirappalli Jn", lat: 10.8, lon: 78.68 },
  { code: "MDU", name: "Madurai Jn", lat: 9.92, lon: 78.12 },
  { code: "TEN", name: "Tirunelveli Jn", lat: 8.72, lon: 77.7 },
  { code: "CAPE", name: "Kanniyakumari", lat: 8.08, lon: 77.55 },
  { code: "ERS", name: "Ernakulam Jn", lat: 9.97, lon: 76.28 },
  { code: "QLN", name: "Kollam Jn", lat: 8.89, lon: 76.6 },
  { code: "TVC", name: "Trivandrum Central", lat: 8.49, lon: 76.95 },
  { code: "PGT", name: "Palakkad Jn", lat: 10.77, lon: 76.65 },
  { code: "CAN", name: "Kannur (Cannanore)", lat: 11.87, lon: 75.36 },
];

const HUBS_BY_CODE = new Map(DEFAULT_HUBS.map((h) => [h.code, h]));

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface ScoredHub extends Hub {
  /** 0..1, higher = more likely to be a useful transfer point. 0.5 = unknown/neutral (no geo data for origin or dest). */
  relevance: number;
  detourRatio: number | null;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

/**
 * Scores a hub for a given origin -> destination pair by how much of a
 * detour it represents (viaDistance / directDistance). A hub that sits
 * roughly "on the way" scores near 1; a hub that requires backtracking
 * scores low.
 *
 * Coordinate resolution order for the origin/destination themselves:
 *   1. `originCoords`/`destCoords`, if the caller passed them — this is
 *      the resolved Place's real lat/lon (e.g. from GeoNames), so a small
 *      station that isn't one of the curated DEFAULT_HUBS junctions still
 *      gets real geographic scoring instead of a shrug.
 *   2. Fall back to a DEFAULT_HUBS lookup by station code, for callers
 *      that only have a code and no Place (kept for backward
 *      compatibility with existing call sites).
 *   3. If neither is available, every hub scores a neutral 0.5 rather
 *      than guessing.
 */
export function scoreHub(
  hub: Hub,
  origin: string,
  destination: string,
  originCoords?: GeoPoint | null,
  destCoords?: GeoPoint | null
): ScoredHub {
  const originStn = originCoords ?? HUBS_BY_CODE.get(origin.toUpperCase());
  const destStn = destCoords ?? HUBS_BY_CODE.get(destination.toUpperCase());

  // Hubs merged in from the live directory or route-topology discovery don't carry real
  // coordinates (lat/lon 0,0 is the sentinel — off the coast of Africa, never a real station).
  // Score those neutrally rather than geo-scoring against a fake (0,0) position.
  const hubHasCoords = !(hub.lat === 0 && hub.lon === 0);

  if (!originStn || !destStn || !hubHasCoords) {
    return { ...hub, relevance: 0.5, detourRatio: null };
  }

  const direct = haversineKm(originStn, destStn);
  const viaOrigin = haversineKm(originStn, hub);
  const viaDest = haversineKm(hub, destStn);

  // Hub is basically on top of the origin or destination already - not a useful transfer.
  if (viaOrigin < 15 || viaDest < 15) {
    return { ...hub, relevance: 0, detourRatio: null };
  }

  const detourRatio = direct > 0 ? (viaOrigin + viaDest) / direct : 1;
  // detourRatio 1.0 = perfectly on the line. Penalize increasingly past that.
  const relevance = Math.max(0, 1 - (detourRatio - 1) * 0.8);
  return { ...hub, relevance, detourRatio };
}

/**
 * Returns candidate hubs ranked by relevance (best first), excluding the
 * origin/destination themselves, capped to `max`. `hubs` defaults to the
 * static geo list but callers (see lib/graph/discover.ts) pass in a merged
 * pool that also includes live/discovered stations from
 * lib/erail/stationDirectory.ts — those don't have coordinates, so they
 * score as a neutral 0.5 via the "no geo data" branch in scoreHub, which
 * keeps them eligible without letting them crowd out well-scored geo hubs.
 */
export function rankedCandidateHubs(
  from: string,
  to: string,
  max = 10,
  hubs: Hub[] = DEFAULT_HUBS,
  originCoords?: GeoPoint | null,
  destCoords?: GeoPoint | null
): ScoredHub[] {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  // De-dupe by code first (a merged pool can contain the same station from multiple sources).
  const byCode = new Map<string, Hub>();
  for (const h of hubs) if (!byCode.has(h.code)) byCode.set(h.code, h);

  return Array.from(byCode.values())
    .filter((h) => h.code !== f && h.code !== t)
    .map((h) => scoreHub(h, f, t, originCoords, destCoords))
    .filter((h) => h.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, max);
}