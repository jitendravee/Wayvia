import { unzipSync } from "fflate";
import { parseCsv } from "./csv";
import type {
  GtfsCalendar,
  GtfsCalendarDate,
  GtfsFeedConfig,
  GtfsRoute,
  GtfsStop,
  GtfsStopTime,
  GtfsTrip,
  LoadedGtfsFeed,
} from "./types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — GTFS static feeds are re-published on the order of days/weeks, not minutes
const FETCH_TIMEOUT_MS = 20_000; // these zips run 5-50MB — a train/erail-style 5s timeout would fail every real feed

const cache = new Map<string, { feed: LoadedGtfsFeed; fetchedAt: number }>();
const inFlight = new Map<string, Promise<LoadedGtfsFeed | null>>();

function readZipEntry(files: Record<string, Uint8Array>, name: string): string | null {
  const bytes = files[name];
  if (!bytes) return null;
  return new TextDecoder("utf-8").decode(bytes);
}

function toNumberOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseFeed(config: GtfsFeedConfig, files: Record<string, Uint8Array>): LoadedGtfsFeed {
  const stops = new Map<string, GtfsStop>();
  for (const rec of parseCsv(readZipEntry(files, "stops.txt") ?? "")) {
    if (!rec.stop_id) continue;
    stops.set(rec.stop_id, {
      stop_id: rec.stop_id,
      stop_name: rec.stop_name ?? rec.stop_id,
      stop_lat: toNumberOrNull(rec.stop_lat),
      stop_lon: toNumberOrNull(rec.stop_lon),
    });
  }

  const routes = new Map<string, GtfsRoute>();
  for (const rec of parseCsv(readZipEntry(files, "routes.txt") ?? "")) {
    if (!rec.route_id) continue;
    routes.set(rec.route_id, {
      route_id: rec.route_id,
      route_short_name: rec.route_short_name || undefined,
      route_long_name: rec.route_long_name || undefined,
      agency_id: rec.agency_id || undefined,
    });
  }

  const trips = new Map<string, GtfsTrip>();
  for (const rec of parseCsv(readZipEntry(files, "trips.txt") ?? "")) {
    if (!rec.trip_id) continue;
    trips.set(rec.trip_id, {
      trip_id: rec.trip_id,
      route_id: rec.route_id,
      service_id: rec.service_id,
      trip_headsign: rec.trip_headsign || undefined,
    });
  }

  const stopTimesByTrip = new Map<string, GtfsStopTime[]>();
  const stopTimesByStop = new Map<string, GtfsStopTime[]>();
  for (const rec of parseCsv(readZipEntry(files, "stop_times.txt") ?? "")) {
    if (!rec.trip_id || !rec.stop_id) continue;
    const st: GtfsStopTime = {
      trip_id: rec.trip_id,
      stop_id: rec.stop_id,
      stop_sequence: Number(rec.stop_sequence) || 0,
      arrival_time: rec.arrival_time || rec.departure_time,
      departure_time: rec.departure_time || rec.arrival_time,
    };
    if (!st.arrival_time || !st.departure_time) continue; // frequencies-only trips (no explicit stop_times) aren't supported

    let byTrip = stopTimesByTrip.get(st.trip_id);
    if (!byTrip) stopTimesByTrip.set(st.trip_id, (byTrip = []));
    byTrip.push(st);

    let byStop = stopTimesByStop.get(st.stop_id);
    if (!byStop) stopTimesByStop.set(st.stop_id, (byStop = []));
    byStop.push(st);
  }
  for (const list of stopTimesByTrip.values()) list.sort((a, b) => a.stop_sequence - b.stop_sequence);

  const calendar = new Map<string, GtfsCalendar>();
  for (const rec of parseCsv(readZipEntry(files, "calendar.txt") ?? "")) {
    if (!rec.service_id) continue;
    calendar.set(rec.service_id, {
      service_id: rec.service_id,
      monday: rec.monday === "1",
      tuesday: rec.tuesday === "1",
      wednesday: rec.wednesday === "1",
      thursday: rec.thursday === "1",
      friday: rec.friday === "1",
      saturday: rec.saturday === "1",
      sunday: rec.sunday === "1",
      start_date: rec.start_date,
      end_date: rec.end_date,
    });
  }

  const calendarDates = new Map<string, GtfsCalendarDate[]>();
  for (const rec of parseCsv(readZipEntry(files, "calendar_dates.txt") ?? "")) {
    if (!rec.service_id || !rec.date) continue;
    const exceptionType = rec.exception_type === "2" ? 2 : 1;
    let list = calendarDates.get(rec.service_id);
    if (!list) calendarDates.set(rec.service_id, (list = []));
    list.push({ service_id: rec.service_id, date: rec.date, exception_type: exceptionType });
  }

  return { config, stops, routes, trips, stopTimesByStop, stopTimesByTrip, calendar, calendarDates, loadedAt: Date.now() };
}

/**
 * Fetches, unzips, and parses one configured GTFS feed, cached for
 * CACHE_TTL_MS. Never throws — a fetch failure, a malformed zip, or a feed
 * that's simply gone all just return null, and the bus provider's GTFS
 * layer treats that as "no coverage from this feed for this search" rather
 * than failing the whole multimodal search (same fail-soft contract every
 * other provider in lib/providers follows).
 */
export async function loadGtfsFeed(config: GtfsFeedConfig): Promise<LoadedGtfsFeed | null> {
  const now = Date.now();
  const cached = cache.get(config.id);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.feed;

  const pending = inFlight.get(config.id);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(config.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; WayviaBot/1.0; +journey-search-gtfs)" },
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`GTFS fetch ${config.id} failed: ${res.status}`);

      const buf = new Uint8Array(await res.arrayBuffer());
      const files = unzipSync(buf, {
        // GTFS files sit at the zip root per spec, but some publishers nest
        // them one folder deep (e.g. "gtfs/stops.txt") — only decompress
        // the *.txt entries actually needed, whichever depth they're at.
        filter: (file) => file.name.toLowerCase().endsWith(".txt"),
      });
      // Normalize away any folder prefix so parseFeed can always ask for the plain filename.
      const flat: Record<string, Uint8Array> = {};
      for (const [name, bytes] of Object.entries(files)) {
        const base = name.split("/").pop()!;
        flat[base] = bytes;
      }

      const feed = parseFeed(config, flat);
      cache.set(config.id, { feed, fetchedAt: Date.now() });
      return feed;
    } catch (err) {
      console.error(`loadGtfsFeed(${config.id}) failed:`, err instanceof Error ? err.message : err);
      // Keep serving a stale feed rather than going empty on a transient failure.
      return cache.get(config.id)?.feed ?? null;
    } finally {
      inFlight.delete(config.id);
    }
  })();

  inFlight.set(config.id, promise);
  return promise;
}
