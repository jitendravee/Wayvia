import { trainProvider } from "./train";
import { busProvider } from "./bus";
import { flightProvider } from "./flight";
/**
 * `providerRegistry.getProviders(modes)` from the architecture doc — the
 * graph/search engine asks this for providers instead of importing
 * eRail/ixigo/flight directly. Train is included here (unlike the older
 * lib/providers/registry.ts, which deliberately left train out because it
 * has a separate, richer multi-hop entry point — see
 * lib/transport/train.ts's trainMultiHopSearch) because the generic
 * Place-graph search in lib/journey/graphSearch.ts still needs a plain
 * point-to-point train edge for cross-mode chains like bus→hub→train.
 */
const REGISTRY = {
    train: trainProvider,
    bus: busProvider,
    flight: flightProvider,
};
export const ALL_MODES = ["train", "bus", "flight"];
export function getProvider(mode) {
    return REGISTRY[mode];
}
export function getProviders(modes) {
    return modes.map(getProvider);
}
