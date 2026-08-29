export type Mode = "train" | "bus" | "flight";

export type AvlStatusCategory = "AVAILABLE" | "WAITLIST" | "RAC" | "NOT_AVAILABLE" | "REGRET" | "UNKNOWN";

export interface AvlAvailability {
  key: string;
  category: AvlStatusCategory;
  count: number | null;
  rawStatus: string;
  rawNums: string;
}

/** Known map coordinates for a station, when it's in the curated directory (lib/geo.ts). */
export interface StationCoord {
  code: string;
  name: string;
  lat: number;| null;
  lon: number;| null;
}

export interface AnnotatedLeg {
  /** Which mode of transport this leg is — train, bus, or flight. */
  mode: Mode;
  /** Generic service id, reused across modes: train number / bus service id / flight number. */
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  travelTime: string;
  runningDays: string;
  depAbsMin: number;
  arrAbsMin: number;
  /** "live" = real data. "mock" = placeholder bus/flight data until a real API is wired in. */
  source?: "live" | "mock";
  /** null for non-train legs — there's no erail key involved for bus/flight (mock or real). */
  avlKey: string | null;
  availability: AvlAvailability | null;
  fare: number | null;
  /** Coordinates for the boarding/alighting stations, when known server-side. Null means the frontend should fall back to live geocoding for that one stop. */
  fromGeo: StationCoord | null;
  toGeo: StationCoord | null;
}

/** One stop along a journey, ready to plot on a map — origin, every hub/junction change, and the final destination. */
export interface RouteStop {
  code: string;
  name: string;
  lat: number | null;
  lon: number | null;
  kind: "origin" | "junction" | "destination";
  time: string;
  /** Mode of the leg that arrives at this stop. Absent for the origin. */
  arrivingMode?: Mode;
  /** Service id (train no / bus id / flight no) of the leg that arrives at this stop. Absent for the origin. */
  arrivingService?: string;
}

export interface AnnotatedJourney {
  legs: AnnotatedLeg[];
  hub?: string;
  hub2?: string;
  hub3?: string;
  hubSource?: "static" | "live" | "route-topology";
  fullyConfirmed: boolean;
  hasBlockedLeg: boolean;
  totalFare: number | null;
  totalDurationMin: number;
  connections: number;
  /** Waiting time between consecutive legs, in minutes — length is always legs.length - 1. */
  gapsMin: number[];
  /** Distinct modes used across this journey's legs, in leg order (deduped). */
  modesUsed: Mode[];
  /** Ordered stop-by-stop map data for this journey — origin, every hub, destination — ready to plot. */
  routeStops: RouteStop[];
}

/** One labeled, colored route on the "ways to get there" overview map — the big multi-route picture, not a single journey's own path. */
export interface MapOverviewEntry {
  id: string;
  /** Numbered position on the map (1, 2, 3, ...). */
  rank: number;
  /** Badge text, e.g. "BEST MATCH", "CHEAPEST", "FASTEST", "GOOD VALUE", "MULTIMODAL". */
  label: string;
  /** Hex color this route's line/pins should use — stable per label. */
  color: string;
  totalFare: number | null;
  totalDurationMin: number;
  connections: number;
  fullyConfirmed: boolean;
  modes: Mode[];
  stops: RouteStop[];
}

export interface PartialCoverage {
  type: "reaches_hub" | "from_hub";
  hub: string;
  hubName?: string;
  leg: AnnotatedLeg;
  note: string;
}

export interface RankedResults {
  bestOverall: AnnotatedJourney;
  cheapest: AnnotatedJourney | null;
  fastest: AnnotatedJourney;
  easiest: AnnotatedJourney;
  mostReliable: AnnotatedJourney;
  confirmedOnly: AnnotatedJourney[];
  all: AnnotatedJourney[];
  alternatives: AnnotatedJourney[];
}

export interface GraphStats {
  nodesDiscovered: number;
  edgesDiscovered: number;
  layers: number;
  hubsExplored: { code: string; name: string; relevance: number; source?: string }[];
  dynamicHubsUsed?: boolean;
  twoHubUsed?: boolean;
  threeHubUsed?: boolean;
}

export interface ConnectionSuggestion {
  nextConnections: 2 | 3;
  message: string;
}

export interface Narrative {
  headline: string;
  detail: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SearchResponse {
  from: string;
  to: string;
  date: string;
  travelClass?: string;
  quota?: string;
  mode?: Mode;
  /** Every mode this search actually queried — e.g. ["train","bus","flight"] once those providers are wired in. */
  modesAvailable?: Mode[];
  /**
   * DEBUG: raw leg count each mode contributed (direct + every hub-crossing
   * leg combined) BEFORE availability filtering — not how many made it into
   * `results`, since that also requires fullyConfirmed. Exists so "ixigo
   * returned 0 legs" is distinguishable from "ixigo returned legs but none
   * had seats" just by reading the response, without server log access.
   * Safe to remove once the bus/flight provider integrations are confirmed
   * working end to end.
   */
  candidatesByMode?: Partial<Record<Mode, number>>;
  graph?: GraphStats;
  maxConnections?: 1 | 2 | 3;
  candidates?: { direct: number; oneConnection: number; twoConnection: number; threeConnection: number };
  fullyConfirmedCount?: number;
  narrative?: Narrative;
  suggestion?: ConnectionSuggestion | null;
  results: RankedResults | null;
  /** Labeled, deduplicated set (≤6) of the best routes for this search, each with its full stop list — the data source for the "ways to get there" overview map showing every option at once, numbered and colored. Empty when there are no results. */
  mapOverview?: MapOverviewEntry[];
  pagination?: PaginationMeta;
  partial?: PartialCoverage[];
  error?: string;
}

/** One user-defined leg of a multi-city itinerary: depart `from` on `date`, headed to `to`. */
export interface TripLeg {
  from: string;
  to: string;
  date: string;
}

/**
 * Response for a multi-city search (A→B on date1, B→C on date2, ...). Each
 * entry in `results` is a full, independent SearchResponse for that leg —
 * same shape the single-leg /api/search returns — so every leg gets its own
 * ranked list, filters, and pagination on the frontend.
 */
export interface MultiSearchResponse {
  legs: TripLeg[];
  results: SearchResponse[];
  error?: string;
}