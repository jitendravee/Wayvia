/**
 * Can `next` follow `prev` in the same journey? Enforces the transfer
 * buffer (architecture doc Part 21/22 — "do not automatically accept a
 * tight connection", and "you cannot assume zero transfer time merely
 * because both belong to the same Place"). Every cross-hub/cross-mode leg
 * pair in this codebase already goes through exactly this check — a
 * bus arriving at a Place's bus stand and a train departing that Place's
 * railway station never get treated as an instant, free transfer, even
 * though both legs' `to`/`from` might both nominally be "Mumbai".
 */
export function canConnect(prev, next, filters) {
    return next.depAbsMin >= prev.arrAbsMin + filters.transferBufferMin;
}
/** True if adding `legFare` (null = unknown) keeps the running total within budget, OR the total is still unknown (a partial journey with an unresolved leg further along could still land under budget — see filters.ts's maxBudget doc). */
export function withinBudget(runningTotal, filters) {
    if (filters.maxBudget == null)
        return true;
    if (runningTotal == null)
        return true;
    return runningTotal <= filters.maxBudget;
}
export function withinDuration(totalDurationMin, filters) {
    return filters.maxDurationMinutes == null || totalDurationMin <= filters.maxDurationMinutes;
}
/** Only meaningful on the FIRST leg of a journey — see SearchFilters.departureFromMin/To doc. */
export function withinDepartureWindow(firstLeg, filters) {
    if (filters.departureFromMin != null && firstLeg.depAbsMin < filters.departureFromMin)
        return false;
    if (filters.departureToMin != null && firstLeg.depAbsMin > filters.departureToMin)
        return false;
    return true;
}
/** Only meaningful on the LAST leg of a journey — see SearchFilters.arrivalFromMin/To doc. */
export function withinArrivalWindow(lastLeg, filters) {
    if (filters.arrivalFromMin != null && lastLeg.arrAbsMin < filters.arrivalFromMin)
        return false;
    if (filters.arrivalToMin != null && lastLeg.arrAbsMin > filters.arrivalToMin)
        return false;
    return true;
}
