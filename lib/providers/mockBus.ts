import type { Leg } from "../graph/types";
import type { AvlAvailability, AvlStatusCategory } from "../erail/avl";
import { ModeProvider, minutesToHHMM, seededRandom } from "./types";

const OPERATORS = [
  "GSRTC Volvo AC",
  "IntrCity SmartBus",
  "Neeta Travels AC Sleeper",
  "VRL Travels",
  "Orange Tours AC",
  "Patel Travels Sleeper",
];

const OPERATOR_PREFIX: Record<string, string> = {
  "GSRTC Volvo AC": "GSRTC",
  "IntrCity SmartBus": "ICTY",
  "Neeta Travels AC Sleeper": "NEETA",
  "VRL Travels": "VRL",
  "Orange Tours AC": "ORNG",
  "Patel Travels Sleeper": "PATEL",
};

/**
 * Generates 2-4 plausible bus services between any two stop codes on a
 * given date. Deterministic per (from, to, date) so re-running the same
 * search doesn't reshuffle results. Every leg is tagged `source: "mock"`
 * so the frontend can badge it clearly as placeholder data, and carries
 * `precomputed` availability/fare so it skips the (train-only) erail
 * lookup entirely — see lib/availability.ts.
 */
export const mockBusProvider: ModeProvider = {
  mode: "bus",
  async search(from, to, date) {
    const rng = seededRandom(`bus:${from}:${to}:${date}`);
    const count = 2 + Math.floor(rng() * 3); // 2–4 services/day
    const baseDurationMin = 240 + Math.floor(rng() * 600); // 4h–14h, stands in for a real distance model

    const legs: Leg[] = [];
    for (let i = 0; i < count; i++) {
      const depAbsMin = Math.floor(rng() * 1440);
      const durationMin = Math.max(90, baseDurationMin + Math.floor((rng() - 0.5) * 90));
      const arrAbsMin = depAbsMin + durationMin;
      const fare = Math.round((300 + rng() * 900) / 10) * 10;
      const seatsLeft = Math.floor(rng() * 32);
      const operator = OPERATORS[Math.floor(rng() * OPERATORS.length)];
      const busId = `${OPERATOR_PREFIX[operator]}${1000 + Math.floor(rng() * 8999)}`;

      const category: AvlStatusCategory = seatsLeft === 0 ? "NOT_AVAILABLE" : seatsLeft <= 3 ? "RAC" : "AVAILABLE";
      const availability: AvlAvailability = {
        key: `mock-bus-${busId}`,
        category,
        count: seatsLeft,
        rawStatus: category === "AVAILABLE" ? `AVAILABLE ${seatsLeft}` : category === "RAC" ? `RAC ${seatsLeft}` : "SOLD OUT",
        rawNums: "",
      };

      legs.push({
        mode: "bus",
        source: "mock",
        trainNo: busId,
        trainName: operator,
        from,
        bookingUrl:"",
        to,
        departure: minutesToHHMM(depAbsMin),
        arrival: minutesToHHMM(arrAbsMin),
        travelTime: minutesToHHMM(durationMin),
        runningDays: "1111111",
        depAbsMin,
        arrAbsMin,
        precomputed: { availability, fare },
      });
    }
    return legs;
  },
};