export type AvlStatusCategory = "AVAILABLE" | "WAITLIST" | "RAC" | "NOT_AVAILABLE" | "REGRET" | "UNKNOWN";

export interface AvlAvailability {
  key: string;
  category: AvlStatusCategory;
  count: number | null;
  rawStatus: string;
  rawNums: string;
}

export interface AnnotatedLeg {
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
  avlKey: string;
  availability: AvlAvailability | null;
  fare: number | null;
}

export interface AnnotatedJourney {
  legs: AnnotatedLeg[];
  hub?: string;
  hub2?: string;
  hubSource?: "static" | "live" | "route-topology";
  fullyConfirmed: boolean;
  hasBlockedLeg: boolean;
  totalFare: number | null;
  totalDurationMin: number;
  connections: number;
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
  modesAvailable?: string[];
  graph?: GraphStats;
  candidates?: { direct: number; oneConnection: number; twoConnection: number };
  fullyConfirmedCount?: number;
  narrative?: Narrative;
  results: RankedResults | null;
  pagination?: PaginationMeta;
  partial?: PartialCoverage[];
  error?: string;
}