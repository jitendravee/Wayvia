import type { LoadedGtfsFeed } from "./types";
import { isoToGtfsDate, weekdayField } from "./time";

/**
 * Every service_id that actually runs on `date` ('YYYY-MM-DD'), per GTFS's
 * two-layer scheduling model: calendar.txt's weekly pattern + date range,
 * then calendar_dates.txt's per-date exceptions layered on top (type 1 =
 * added even though the weekly pattern says no; type 2 = removed even
 * though it says yes). A service_id defined ONLY via calendar_dates.txt
 * (no calendar.txt row at all — GTFS explicitly allows this, and several
 * feeds use it exclusively) is handled too: it simply has no weekly-pattern
 * base to start from, so only its calendar_dates additions ever turn it on.
 */
export function activeServiceIds(feed: LoadedGtfsFeed, date: string): Set<string> {
  const gtfsDate = isoToGtfsDate(date);
  const weekday = weekdayField(date);
  const active = new Set<string>();

  for (const cal of feed.calendar.values()) {
    if (cal.start_date && gtfsDate < cal.start_date) continue;
    if (cal.end_date && gtfsDate > cal.end_date) continue;
    if (cal[weekday]) active.add(cal.service_id);
  }

  for (const [serviceId, exceptions] of feed.calendarDates) {
    for (const ex of exceptions) {
      if (ex.date !== gtfsDate) continue;
      if (ex.exception_type === 1) active.add(serviceId);
      else active.delete(serviceId);
    }
  }

  return active;
}
