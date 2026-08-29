export function initialState(origin) {
    return {
        currentPlace: origin,
        legs: [],
        visitedPlaceIds: new Set([origin.id]),
        connections: 0,
        totalDurationMin: 0,
        totalCost: 0,
    };
}
