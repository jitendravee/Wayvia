import { minutesToHHMM } from "../types";
/** Midnight of `date` ('YYYY-MM-DD'), as an epoch ms, in IST. India has no DST so a fixed +05:30 offset is always correct. */
function istMidnightEpochMs(date) {
    return Date.parse(`${date}T00:00:00+05:30`);
}
/**
 * Maps one ixigo `serviceDetailsList` entry to our Leg shape, anchored to
 * the search date's midnight the exact same way train legs are (see
 * lib/graph/discover.ts's withAbsoluteTimes) — so a bus leg's depAbsMin/
 * arrAbsMin compare directly against a train leg's when building mixed
 * train+bus candidates, no separate unit-conversion needed downstream.
 *
 * Returns null (rather than throwing) for a malformed entry — one bad
 * record from ixigo shouldn't drop every other bus on the list.
 */
export function mapIxigoServiceToLeg(item, from, to, searchDate) {
    const midnightMs = istMidnightEpochMs(searchDate);
    const depMs = item.startTimestamp ? item.startTimestamp * 1000 : Date.parse(item.startTimeDateFormat);
    if (!depMs || Number.isNaN(depMs))
        return null;
    let arrMs = item.arriveTimestamp ? item.arriveTimestamp * 1000 : NaN;
    if (Number.isNaN(arrMs)) {
        // No arrival timestamp — fall back to departure + travelTime ("HH:MM:SS").
        const [h, m, s] = (item.travelTime ?? "0:0:0").split(":").map(Number);
        arrMs = depMs + ((h || 0) * 60 + (m || 0)) * 60000 + (s || 0) * 1000;
    }
    const depAbsMin = Math.round((depMs - midnightMs) / 60000);
    const arrAbsMin = Math.round((arrMs - midnightMs) / 60000);
    const durationMin = Math.max(1, arrAbsMin - depAbsMin);
    const seatsLeft = Number(item.availableSeats) || 0;
    const category = seatsLeft === 0 ? "NOT_AVAILABLE" : seatsLeft <= 3 ? "RAC" : "AVAILABLE";
    const availability = {
        key: `ixigo-bus-${item.serviceKey}`,
        category,
        count: seatsLeft,
        rawStatus: category === "AVAILABLE" ? `AVAILABLE ${seatsLeft}` : category === "RAC" ? `${seatsLeft} left` : "SOLD OUT",
        rawNums: "",
    };
    const fareNum = Number(item.sortFare ?? item.fare);
    const fare = Number.isFinite(fareNum) && fareNum > 0 ? fareNum : null;
    const operator = item.travelerAgentName || item.serviceName || "Bus operator";
    const busType = item.busTypeName ? ` · ${item.busTypeName}` : "";
    return {
        mode: "bus",
        source: "live",
        trainNo: String(item.serviceKey ?? item.masterId ?? `${from}-${to}-${depAbsMin}`),
        trainName: `${operator}${busType}`,
        from,
        to,
        departure: minutesToHHMM(depAbsMin),
        arrival: minutesToHHMM(arrAbsMin),
        travelTime: minutesToHHMM(durationMin),
        // ixigo's search is for one specific date, not a weekly timetable the
        // way erail's is — "runs every day" is the closest honest stand-in, and
        // nothing downstream re-checks runningDays for non-train legs anyway
        // (see the comment on Leg.precomputed in lib/graph/types.ts).
        runningDays: "1111111",
        depAbsMin,
        arrAbsMin,
        precomputed: { availability, fare },
    };
}
