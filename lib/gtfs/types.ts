/**
 * Minimal GTFS static row shapes — only the fields this codebase actually
 * reads out of each file. Real GTFS files carry many more optional columns
 * (colors, wheelchair flags, zone ids, ...); anything not listed here is
 * simply ignored during parsing, not an error.
 */

export interface GtfsStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number | null;
  stop_lon: number | null;
}

export interface GtfsRoute {
  route_id: string;
  route_short_name?: string;
  route_long_name?: string;
  agency_id?: string;
}

export interface GtfsTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
}

export interface GtfsStopTime {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  /** "HH:MM:SS" — GTFS allows hours >= 24 for next-day trips (e.g. "25:30:00"), on purpose: keep as the raw string, parse with parseGtfsTime(). */
  arrival_time: string;
  departure_time: string;
}

export interface GtfsCalendar {
  service_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string; // YYYYMMDD
  end_date: string; // YYYYMMDD
}

export interface GtfsCalendarDate {
  service_id: string;
  date: string; // YYYYMMDD
  exception_type: 1 | 2; // 1 = service added for this date, 2 = service removed
}

/**
 * One configured GTFS static source — a state/city transport operator's
 * published feed. Adding a new operator to the bus search is just adding
 * one entry to lib/gtfs/feeds.ts's GTFS_FEEDS array; nothing else in the
 * loading/search/merge pipeline needs to change.
 */
export interface GtfsFeedConfig {
  id: string;
  /** Display name, e.g. "BMTC (Bengaluru)" — shown in the leg's operator text. */
  name: string;
  state: string;
  /**
   * What geographic scope this feed's *routes* actually cover — not what
   * area its stops sit in. A city corporation's stops all sit inside one
   * metro area (routes stay within it); a state corporation's routes leave
   * the home city for other towns in-state; an interstate operator's
   * routes cross state lines entirely. This only affects labeling/search
   * prioritization, never correctness — the matching/search code in
   * lib/gtfs/matchStop.ts and lib/gtfs/search.ts works identically
   * regardless of scope, so a feed can be added here the moment a real URL
   * exists without any other code change.
   */
  scope: "city" | "state" | "interstate";
  /** Direct, publicly-fetchable URL to the feed's .zip. Must not require auth/a session/an API key — see the big comment in feeds.ts about why most Indian STU feeds don't qualify. */
  url: string;
  /** Names this feed's home city is known by (lowercase) — used to recognize when a Place IS this feed's city (as opposed to one specific stop within it), so a sensible default boarding stop can be picked via hubStopHints. */
  cityAliases: string[];
  /** A few well-known major terminus/hub stop names for this feed (lowercase, substring-matched), used only when a Place matches cityAliases above and a specific stop still needs to be picked. Best-effort only. First match wins. */
  hubStopHints?: string[];
}

/** A fully loaded, indexed feed — what loadGtfsFeed() returns and caches per feed id. */
export interface LoadedGtfsFeed {
  config: GtfsFeedConfig;
  stops: Map<string, GtfsStop>;
  routes: Map<string, GtfsRoute>;
  trips: Map<string, GtfsTrip>;
  /** stop_id -> every stop_time at that stop, across every trip. */
  stopTimesByStop: Map<string, GtfsStopTime[]>;
  /** trip_id -> that trip's full stop_times, sorted by stop_sequence ascending. */
  stopTimesByTrip: Map<string, GtfsStopTime[]>;
  calendar: Map<string, GtfsCalendar>;
  /** service_id -> its calendar_dates.txt exceptions (both added and removed dates). */
  calendarDates: Map<string, GtfsCalendarDate[]>;
  loadedAt: number;
}
