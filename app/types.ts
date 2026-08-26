export type Mode = "train" | "bus" | "flight";

export type AvlStatusCategory = "AVAILABLE" | "WAITLIST" | "RAC" | "NOT_AVAILABLE" | "REGRET" | "UNKNOWN";

export interface AvlAvailability {
  key: string;
  category: AvlStatusCategory;
  count: number | null;
  rawStatus: string;
  rawNums: string;
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
  mode?: "train";
  /** Every mode this search actually queried — e.g. ["train","bus","flight"] once those providers are wired in. */
  modesAvailable?: Mode[];
  graph?: GraphStats;
  maxConnections?: 1 | 2 | 3;
  candidates?: { direct: number; oneConnection: number; twoConnection: number; threeConnection: number };
  fullyConfirmedCount?: number;
  narrative?: Narrative;
  suggestion?: ConnectionSuggestion | null;
  results: RankedResults | null;
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