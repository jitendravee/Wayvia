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
  /** Hub station code this candidate was constructed through, if not direct. */
  hub?: string;
}
