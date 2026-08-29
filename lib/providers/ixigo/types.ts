/**
 * Shapes for the two ixigo endpoints we call:
 *   - GET  https://www.ixigo.com/abus-autocompleter/api/v1/results?s=<query>
 *   - POST https://www.ixigo.com/wap/GetBusList
 *
 * Both reverse-engineered from real captured samples (not guessed) —
 * except the GetBusList *request* body, which is inferred (see
 * client.ts's buildBusListRequest for exactly what's uncertain there and
 * why). Only the fields this codebase actually reads are typed; ixigo's
 * real responses carry a lot more we don't need (deals, banners, filter
 * lists, etc.) and those are left untyped rather than modeled.
 */

/** One matched place from the autocompleter — usually a city, occasionally an airport-style sub-entity (e.g. "Hyderabad Airport RGIA"). */
export interface IxigoAutocompleteResult {
  id: number;
  label: string;
  display_text: string;
  display_subtext: string | null;
  city: string;
  state_name: string;
  state_code: string;
  alias_type: string; // "City" for the entries we care about
  /** 1 = ixigo has a "reference" city record for this (bookable); 0 = a sub-entity like an airport variant that often isn't independently bookable. */
  stn_rfn: number;
  boarding_points: { name: string; alias: string; lat: string; lng: string }[];
}

/** One bus service from GetBusList's `serviceDetailsList`. */
export interface IxigoServiceDetail {
  serviceKey: string;
  masterId?: number;
  travelerAgentName: string; // operator display name, e.g. "PSR Travels Goa (SOARES)"
  serviceName?: string;
  busTypeName: string; // e.g. "VE AC Sleeper (2 + 1)"
  startTime: string; // "06:00 PM"
  arriveTime: string; // "09:00 AM"
  startTimeDateFormat: string; // ISO with offset, e.g. "2026-08-31T18:00:00+05:30"
  travelTime: string; // "HH:MM:SS", e.g. "15:00:00"
  availableSeats: string; // numeric string
  fare: string; // numeric string, base fare
  sortFare?: number; // effective/discounted fare ixigo itself sorts by — prefer this when present
  journeyDate: string; // "2026-08-31"
  startTimestamp: number; // unix seconds
  arriveTimestamp: number; // unix seconds
  rating?: number;
  isVolvo?: number;
  isLuxury?: number;
}

export interface IxigoGetBusListResponse {
  status: string;
  statusCode: string;
  serviceDetailsList?: IxigoServiceDetail[];
  source?: string;
  destination?: string;
  minFare?: string;
  maxFare?: string;
}
