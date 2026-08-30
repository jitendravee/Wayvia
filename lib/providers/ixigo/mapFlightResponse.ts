import type { Leg } from "../../graph/types";
import type { IxigoFlightResult } from "./types";
import type { AvlAvailability, AvlStatusCategory } from "../../erail/avl";
import { minutesToHHMM } from "../types";

/**
 * Maps one ixigo flight result to our Leg shape.
 * NOTE: The outlook/ranged endpoint does not return flight times, so we
 * set departure, arrival, and travelTime to placeholders. In a real
 * implementation, these should be obtained from a flight schedule endpoint.
 */
export function mapIxigoFlightToLeg(
  result: IxigoFlightResult,
  origin: string,
  destination: string,
): Leg | null {
  // We don't have time information, so we use placeholders.
  // This is not ideal but allows the provider to be integrated.
  const depAbsMin = 0; // 00:00
  const arrAbsMin = 0; // 00:00
  const durationMin = 0; // 00:00

  const fare = result.fare ?? null;
  const seatsLeft = fare > 0 ? 10 : 0; // dummy availability
  const category: AvlStatusCategory = seatsLeft === 0 ? "NOT_AVAILABLE" : "AVAILABLE";

  const availability: AvlAvailability = {
    key: `ixigo-flight-${result.flightNumber}-${result.date}`,
    category,
    count: seatsLeft,
    rawStatus:
      category === "AVAILABLE" ? `AVAILABLE ${seatsLeft}` : "SOLD OUT",
    rawNums: "",
  };

  return {
    mode: "flight",
    source: "live",
    trainNo: result.flightNumber,
    trainName: result.airline,
    from: origin,
    to: destination,
    departure: minutesToHHMM(depAbsMin),
    arrival: minutesToHHMM(arrAbsMin),
    travelTime: minutesToHHMM(durationMin),
    // Since we don't have a weekly timetable, we set to daily.
    runningDays: "1111111",
    depAbsMin,
    arrAbsMin,
    precomputed: { availability, fare },
  };
}
