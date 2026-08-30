import type { Leg } from "../../graph/types";
import type { ModeProvider} from "./types";
import { ixigoGetFlightList } from "./client";
import { mapIxigoFlightToLeg } from "./mapFlightResponse";
import { resolvePlace } from "../../places/resolver";
import type { Place } from "../../places/model";

const CITY_TO_IATA: Record<string, string> = {
  'new delhi': 'DEL',
  'mumbai': 'BOM',
  'pune': 'PNQ',
  'bangalore': 'BLR',
  'hyderabad': 'HYD',
  'chennai': 'MAA',
  'kolkata': 'CCU',
  'ahmedabad': 'AMD',
  'goa': 'GOI',
  'jaipur': 'JAI',
  'lucknow': 'LKO',
  'kochi': 'COK',
  'vizag': 'VTZ',
  'indore': 'IDR',
  'nagpur': 'NAG',
  'bhubaneswar': 'BBI',
  'vadodara': 'BDQ',
  'surat': 'STV',
  'patna': 'PAT',
  'rajahmundry': 'RJA',
  'raipur': 'RPR',
  'jammu': 'IXJ',
  'srinagar': 'SXR',
  'deen': 'DED',
  'amd': 'AMD', // Ahmedabad
  'del': 'DEL',
  'bom': 'BOM',
  'pnq': 'PNQ',
  'blr': 'BLR',
  'hyd': 'HYD',
  'maa': 'MAA',
  'ccu': 'CCU',
  'jai': 'JAI',
  'lko': 'LKO',
  'kok': 'COK',
  'vtz': 'VTZ',
  'idr': 'IDR',
  'nag': 'NAG',
  'bbi': 'BBI',
  'bdq': 'BDQ',
  'stv': 'STV',
  'pat': 'PAT',
  'rja': 'RJA',
  'rpr': 'RPR',
  'ixj': 'IXJ',
  'sxr': 'SXR',
  'ded': 'DED',
};

function normalizeCityName(name: string): string {
  return name.trim().toLowerCase();
}

function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/**
 * Real ixigo-backed flight search using the outlook/ranged endpoint.
 * Note: this endpoint returns fare calendar data but not flight times.
 * Times are set to placeholders (00:00) and should be replaced with
 * real times from a schedule endpoint in the future.
 */
export const ixigoFlightProvider: ModeProvider = {
  mode: "flight",
  async search(from, to, date): Promise<Leg[]> {
    console.log(`[FlightProvider] Searching for flights from "${from}" to "${to}" on date ${date}`);
    // Resolve the place names to Place objects
    const fromPlace = await resolvePlace(from);
    const toPlace = await resolvePlace(to);
    console.log(`[FlightProvider] Resolved fromPlace:`, fromPlace ? { id: fromPlace.id, name: fromPlace.name, flight: fromPlace.flight } : null);
    console.log(`[FlightProvider] Resolved toPlace:`, toPlace ? { id: toPlace.id, name: toPlace.name, flight: toPlace.flight } : null);
    if (!fromPlace || !toPlace) {
      console.log(`[FlightProvider] Could not resolve places`);
      return [];
    }

    // Extract IATA codes from the place objects.
    // We assume the place has a flight property with an airports array.
    let originCode = fromPlace.flight?.airports[0]?.code;
    let destinationCode = toPlace.flight?.airports[0]?.code;
    console.log(`[FlightProvider] Origin code from place.flight: ${originCode}`);
    console.log(`[FlightProvider] Destination code from place.flight: ${destinationCode}`);

    // If not found in flight.airports, try to map from city name.
    if (!originCode) {
      const normalized = normalizeCityName(fromPlace.name);
      originCode = CITY_TO_IATA[normalized] ?? fromPlace.name;
      console.log(`[FlightProvider] Origin code from city mapping: ${originCode}`);
    }
    if (!destinationCode) {
      const normalized = normalizeCityName(toPlace.name);
      destinationCode = CITY_TO_IATA[normalized] ?? toPlace.name;
      console.log(`[FlightProvider] Destination code from city mapping: ${destinationCode}`);
    }

    if (!originCode || !destinationCode) {
      console.log(`[FlightProvider] Could not determine IATA codes`);
      return [];
    }

    const params = {
      origin: originCode,
      destination: destinationCode,
      departureDate: isoToDDMMYYYY(date),
      fareClass: "e",
      paxCombinationType: "100",
      refundTypes: "REFUNDABLE,NON_REFUNDABLE,PARTIALLY_REFUNDABLE",
    };
    console.log(`[FlightProvider] Request params:`, params);

    let raw;
    try {
      raw = await ixigoGetFlightList(params);
      console.log(`[FlightProvider] Got response from ixigo:`, { resultsCount: raw.data.going.results?.length });
    } catch (err) {
      console.error(`[FlightProvider] ixigoGetFlightList failed:`, err);
      return [];
    }

    const results = raw.data.going.results ?? [];
    console.log(`[FlightProvider] Number of flight results: ${results.length}`);
    const legs: Leg[] = [];
    for (const item of results) {
      const leg = mapIxigoFlightToLeg(item, originCode, destinationCode);
        console.log("Flight result:", { flightNumber: item.flightNumber, airline: item.airline, fare: item.fare });
      if (leg) {
        legs.push(leg);
        console.log(`[FlightProvider] Added leg:`, { flightNumber: leg.trainNo, airline: leg.trainName, fare: leg.precomputed?.fare });
      }
    }
    console.log(`[FlightProvider] Returning ${legs.length} legs`);
    return legs;
  },
};
