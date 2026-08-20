export interface Leg {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departure: string; // 'HH:MM' as returned by erail (normalized)
  arrival: string;
  travelTime: string; // 'HH:MM'
  runningDays: string; // e.g. '1111111', indexed via Prettify.getDayOnDate
  /** Minutes since the search date's midnight (day 0). Can exceed 1440 for overnight legs. */
  depAbsMin: number;
  arrAbsMin: number;
}

export interface JourneyCandidate {
  legs: Leg[];
  /** Hub station code this candidate was constructed through, if not direct. First hub for multi-hub candidates. */
  hub?: string;
  /** Second hub, only set for 2-connection (3-leg) candidates. */
  hub2?: string;
  /** Third hub, only set for 3-connection (4-leg) candidates. */
  hub3?: string;
  /** Where the hub(s) for this candidate came from — static geo list, the live station directory, or real-route topology discovery. */
  hubSource?: "static" | "live" | "route-topology";
}

/**
 * A journey that couldn't be completed end-to-end, but where a real,
 * running train covers *part* of it. Surfaced instead of just saying "no
 * results" — e.g. "we found a confirmed train from A to X; no onward
 * connection from X to B was found on this date, but X is a major junction
 * so it's worth searching that leg on its own."
 */
export interface PartialCoverage {
  /** "reaches_hub" = origin -> hub is covered, onward hub -> destination is the gap.
   *  "from_hub" = hub -> destination is covered, the gap is getting from origin to that hub. */
  type: "reaches_hub" | "from_hub";
  hub: string;
  hubName?: string;
  leg: Leg;
  note: string;
}