import { minutesToHHMM, seededRandom } from "./types";
const AIRLINES = [
    { name: "IndiGo", code: "6E" },
    { name: "Air India", code: "AI" },
    { name: "SpiceJet", code: "SG" },
    { name: "Vistara", code: "UK" },
    { name: "Akasa Air", code: "QP" },
];
/**
 * Generates 1-3 plausible flights between any two stop codes on a given
 * date. Same deterministic-per-request approach as mockBus. Real flight
 * legs are naturally much faster and pricier than trains/buses, which is
 * reflected here so ranking/sorting behaves sensibly even on mock data.
 */
export const mockFlightProvider = {
    mode: "flight",
    async search(from, to, date) {
        const rng = seededRandom(`flight:${from}:${to}:${date}`);
        const count = 1 + Math.floor(rng() * 3); // 1–3 flights/day
        const baseDurationMin = 60 + Math.floor(rng() * 120); // 1h–3h
        const legs = [];
        for (let i = 0; i < count; i++) {
            const depAbsMin = Math.floor(rng() * 1440);
            const durationMin = Math.max(45, baseDurationMin + Math.floor((rng() - 0.5) * 30));
            const arrAbsMin = depAbsMin + durationMin;
            const fare = Math.round((2500 + rng() * 4500) / 50) * 50;
            const seatsLeft = Math.floor(rng() * 20);
            const airline = AIRLINES[Math.floor(rng() * AIRLINES.length)];
            const flightNo = `${airline.code}${100 + Math.floor(rng() * 899)}`;
            const category = seatsLeft === 0 ? "NOT_AVAILABLE" : seatsLeft <= 2 ? "RAC" : "AVAILABLE";
            const availability = {
                key: `mock-flight-${flightNo}`,
                category,
                count: seatsLeft,
                rawStatus: category === "AVAILABLE" ? `AVAILABLE ${seatsLeft}` : category === "RAC" ? `LIMITED ${seatsLeft}` : "SOLD OUT",
                rawNums: "",
            };
            legs.push({
                mode: "flight",
                source: "mock",
                trainNo: flightNo,
                trainName: airline.name,
                from,
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
