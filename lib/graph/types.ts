export type Mode = "train" | "bus" | "flight";

export interface Leg {
  /** Which mode of transport this leg is — the thing that lets journeys mix train+bus+flight legs. */
  mode: Mode;
  /**
   * Generic service identifier, reused across modes: train number for
   * train, a bus service id for bus, a flight number for flight. Kept as
   * `trainNo`/`trainName` (not renamed to something mode-neutral) so the
   * existing train pipeline and every FE component that already reads
   * these fields keeps working unmodified as new modes get added.
   */
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departure: string; // 'HH:MM' as returned by erail (normalized) — non-train providers use the same 'HH.MM' style
  arrival: string;
  travelTime: string; // 'HH:MM'
  runningDays: string; // e.g. '1111111', indexed via Prettify.getDayOnDate
  /** Minutes since the search date's midnight (day 0). Can exceed 1440 for overnight legs. */
  depAbsMin: number;
  arrAbsMin: number;
  /** "live" = real data (erail today). "mock" = placeholder data standing in until a real bus/flight API is wired up. Omitted defaults to "live". */
  source?: "live" | "mock";
  /**
   * Only set on legs built by a non-train ModeProvider (see lib/providers).
   * Since those providers generate their own price/seat data instead of
   * looking it up on erail, annotateWithAvailability uses this as-is
   * rather than trying to build an erail avl key for it. A real bus/flight
   * API integration can keep using this same field, or extend
   * annotateWithAvailability with its own lookup branch — either works.
   */
  precomputed?: { availability: import("../erail/avl").AvlAvailability | null; fare: number | null };
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