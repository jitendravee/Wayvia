/**
 * Parses a GTFS "HH:MM:SS" time into minutes since that service day's
 * midnight. GTFS deliberately allows HH >= 24 for a trip that runs past
 * midnight (e.g. "25:30:00" = 1:30am the next calendar day, but still
 * counted from the *service day's* start) — which is exactly the same
 * "can exceed 1440" convention lib/graph/types.ts's Leg.depAbsMin/arrAbsMin
 * already use for train/bus legs, so no rollover math is needed here at
 * all: the raw parsed value is already what a Leg wants.
 */
export function parseGtfsTime(hhmmss: string): number | null {
  const m = hhmmss.trim().match(/^(\d{1,3}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, h, mm, ss] = m;
  return Number(h) * 60 + Number(mm) + Number(ss) / 60;
}

/** 'YYYY-MM-DD' -> GTFS's 'YYYYMMDD' (calendar.txt/calendar_dates.txt date format). */
export function isoToGtfsDate(iso: string): string {
  return iso.replaceAll("-", "");
}

const WEEKDAY_FIELDS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** 0=Sunday..6=Saturday for 'YYYY-MM-DD', computed in UTC to avoid the server's local timezone shifting the date. */
export function weekdayField(iso: string): (typeof WEEKDAY_FIELDS)[number] {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_FIELDS[day];
}
