"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePlaceName = normalizePlaceName;
exports.placeIdFromName = placeIdFromName;
exports.placeFromHubSeed = placeFromHubSeed;
exports.resolvePlace = resolvePlace;
var hubs_1 = require("../graph/hubs");
var stations_1 = require("../stations");
var client_1 = require("../providers/ixigo/client");
var cityResolve_1 = require("../providers/ixigo/cityResolve");
var countriesDev_1 = require("./countriesDev");
/**
 * "Pune Junction" -> "pune", "Secunderabad Junction, Hyderabad" -> "hyderabad".
 * This is the identity function for the whole Place system — two records
 * that normalize to the same string ARE the same Place, whichever provider
 * they came from. Deliberately reuses cityNameFromStationName (already
 * battle-tested for turning erail's junction-heavy names into plain city
 * names for ixigo) rather than inventing a second, subtly different
 * normalizer.
 */
function normalizePlaceName(rawName) {
    return (0, cityResolve_1.cityNameFromStationName)(rawName).trim().toLowerCase();
}
/** Normalized name -> stable Place id. Kept as its own function (even though it's currently identical to normalizePlaceName) so the id format can change independently of the matching logic later — e.g. adding a state suffix to disambiguate same-named towns in different states. */
function placeIdFromName(rawName) {
    return normalizePlaceName(rawName).replace(/\s+/g, "-");
}
var HUB_BY_NORMALIZED_NAME = new Map(hubs_1.DEFAULT_HUBS.map(function (h) { return [normalizePlaceName(h.name), h]; }));
/** Merges a new railway station into an existing (or brand-new) Place, deduping by station code. */
function withRailway(place, station) {
    var _a, _b;
    var stations = (_b = (_a = place.railway) === null || _a === void 0 ? void 0 : _a.stations) !== null && _b !== void 0 ? _b : [];
    if (stations.some(function (s) { return s.code === station.code; }))
        return place;
    return __assign(__assign({}, place), { railway: { stations: __spreadArray(__spreadArray([], stations, true), [station], false) } });
}
/** Merges a new bus location into an existing (or brand-new) Place, deduping by name. */
function withBus(place, bus) {
    var _a, _b;
    var locations = (_b = (_a = place.bus) === null || _a === void 0 ? void 0 : _a.locations) !== null && _b !== void 0 ? _b : [];
    if (locations.some(function (b) { return b.name.toLowerCase() === bus.name.toLowerCase(); }))
        return place;
    return __assign(__assign({}, place), { bus: { locations: __spreadArray(__spreadArray([], locations, true), [bus], false) } });
}
function blankPlace(name) {
    var normalized = normalizePlaceName(name);
    return {
        id: placeIdFromName(name),
        name: name,
        normalizedName: normalized,
        latitude: 0,
        longitude: 0,
        hasCoords: false,
        type: "city",
        isHub: false,
    };
}
/**
 * Builds a Place directly from a curated hub-seed entry — no network calls,
 * no station-directory search. Used by lib/places/graph.ts to turn the
 * geo seed list into real, searchable Place objects for candidate-neighbor
 * scoring without paying an erail/ixigo round trip for every one of them
 * up front. Idempotent: called once per hub per process via
 * lib/places/repository.ts's getOrCreateHubPlace, which caches the result.
 */
function placeFromHubSeed(hub) {
    var cityName = (0, cityResolve_1.cityNameFromStationName)(hub.name);
    var place = blankPlace(cityName);
    place = withRailway(place, { code: hub.code, name: hub.name });
    place = __assign(__assign({}, place), { latitude: hub.lat, longitude: hub.lon, hasCoords: !(hub.lat === 0 && hub.lon === 0), isHub: true });
    return place;
}
/**
 * Best-effort geocoding for a place the curated hub seed list doesn't know
 * the coordinates of — OpenStreetMap's Nominatim, free and keyless. This
 * is genuinely optional: every place that shows up via a real erail
 * station or ixigo city search still resolves and searches correctly
 * without coordinates (see lib/places/graph.ts — no-coordinate places just
 * score neutrally for hub-relevance instead of being excluded). Coordinates
 * only sharpen *which* places get explored as transfer points; they were
 * never required for a place to be searchable or bookable.
 *
 * NOTE: this couldn't be exercised against the real nominatim.openstreetmap.org
 * endpoint in the sandbox this was built in (outbound network there is
 * allow-listed to package registries only) — the request shape follows
 * Nominatim's documented usage policy (a single query param, a real
 * User-Agent identifying the app, response JSON parsed defensively), but
 * verify this against a live environment before relying on it.
 */
var geocodeCache = new Map();
var CITY_TO_IATA = {
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
function normalizeCityName(name) {
    return name.trim().toLowerCase();
}
function geocodePlace(name) {
    return __awaiter(this, void 0, void 0, function () {
        var key, result, url, res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = normalizePlaceName(name);
                    if (geocodeCache.has(key))
                        return [2 /*return*/, geocodeCache.get(key)];
                    result = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=".concat(encodeURIComponent(name));
                    return [4 /*yield*/, fetch(url, { headers: { "User-Agent": "wayvia-journey-search/1.0 (place resolution)" } })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = (_a.sent());
                    if (data.length > 0) {
                        result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error("geocodePlace(".concat(name, ") failed:"), err_1);
                    result = null;
                    return [3 /*break*/, 6];
                case 6:
                    geocodeCache.set(key, result);
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Resolves free-text input (a station code, a station name, or a plain
 * city name typed into the search box) into a canonical Place — using
 * countries.dev as the primary source for global place discovery, then
 * enriching with transport-location data from providers.
 *
 * Never throws — an unresolvable query returns null, which callers treat
 * as "not a real place" (e.g. reject the search) rather than crashing.
 */
function resolvePlace(query) {
    return __awaiter(this, void 0, void 0, function () {
        var q, countriesDevPlaces, place, stationMatches, bestStation, cityName, _i, stationMatches_1, s, ixigoResults, cityMatch, err_2, hubSeed, geo, stationMatches, railwayStations, _a, stationMatches_2, s, ixigoResults, airportLocations, _b, ixigoResults_1, r, normalized, iataCode, err_3, ixigoResults, busLocations, _c, ixigoResults_2, r, err_4;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    q = query.trim();
                    if (!q)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, (0, countriesDev_1.fetchCountriesDevPlaces)(q, 5)];
                case 1:
                    countriesDevPlaces = _f.sent();
                    place = null;
                    if (countriesDevPlaces.length > 0) {
                        // Take the best match (first result from countries.dev is already ranked)
                        place = __assign({}, countriesDevPlaces[0]);
                        // Override the name with the original query if it's a better match
                        // This handles cases where countries.dev might return a variant name
                        place.name = q;
                        place.normalizedName = normalizePlaceName(q);
                        place.id = placeIdFromName(q);
                    }
                    if (!!place) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, stations_1.searchStations)(q, 3)];
                case 2:
                    stationMatches = _f.sent();
                    bestStation = (_d = stationMatches.find(function (s) { return s.code.toUpperCase() === q.toUpperCase(); })) !== null && _d !== void 0 ? _d : stationMatches[0];
                    if (bestStation) {
                        cityName = (0, cityResolve_1.cityNameFromStationName)(bestStation.name);
                        place = blankPlace(cityName);
                        place = withRailway(place, { code: bestStation.code, name: bestStation.name });
                        if (bestStation.state)
                            place.state = bestStation.state;
                        // Every other station in this same directory result set that maps to the
                        // same city (e.g. searching "Mumbai" can surface BCT, CSMT, LTT together)
                        // belongs to the same Place, not three separate ones.
                        for (_i = 0, stationMatches_1 = stationMatches; _i < stationMatches_1.length; _i++) {
                            s = stationMatches_1[_i];
                            if (normalizePlaceName((0, cityResolve_1.cityNameFromStationName)(s.name)) === place.normalizedName) {
                                place = withRailway(place, { code: s.code, name: s.name });
                            }
                        }
                    }
                    // 2b) No station matched at all — fall back to treating the query as a plain
                    //     place name (this is the bus-only-city case: no train station exists).
                    if (!place)
                        place = blankPlace(q);
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, client_1.ixigoAutocomplete)(place.normalizedName === normalizePlaceName(q) ? q : place.name)];
                case 4:
                    ixigoResults = _f.sent();
                    cityMatch = ixigoResults.find(function (r) { return r.alias_type === "City" && normalizePlaceName(r.label) === place.normalizedName; });
                    if (cityMatch)
                        place = withBus(place, { name: cityMatch.label, provider: "ixigo" });
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _f.sent();
                    console.error("resolvePlace ixigo lookup for \"".concat(q, "\" failed:"), err_2);
                    return [3 /*break*/, 6];
                case 6:
                    hubSeed = HUB_BY_NORMALIZED_NAME.get(place.normalizedName);
                    if (!hubSeed) return [3 /*break*/, 7];
                    place = __assign(__assign({}, place), { latitude: hubSeed.lat, longitude: hubSeed.lon, hasCoords: true, isHub: true });
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, geocodePlace(place.name)];
                case 8:
                    geo = _f.sent();
                    if (geo)
                        place = __assign(__assign({}, place), { latitude: geo.lat, longitude: geo.lon, hasCoords: true });
                    _f.label = 9;
                case 9:
                    if (!place) return [3 /*break*/, 19];
                    if (!(!place.railway || place.railway.stations.length === 0)) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, stations_1.searchStations)(q, 10)];
                case 10:
                    stationMatches = _f.sent();
                    railwayStations = [];
                    for (_a = 0, stationMatches_2 = stationMatches; _a < stationMatches_2.length; _a++) {
                        s = stationMatches_2[_a];
                        if (normalizePlaceName((0, cityResolve_1.cityNameFromStationName)(s.name)) === place.normalizedName) {
                            railwayStations.push({ code: s.code, name: s.name });
                            if (s.state && !place.state)
                                place.state = s.state;
                        }
                    }
                    if (railwayStations.length > 0) {
                        place.railway = { stations: railwayStations };
                    }
                    _f.label = 11;
                case 11:
                    if (!(!place.flight || place.flight.airports.length === 0)) return [3 /*break*/, 15];
                    _f.label = 12;
                case 12:
                    _f.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, (0, client_1.ixigoAutocomplete)(place.name)];
                case 13:
                    ixigoResults = _f.sent();
                    airportLocations = [];
                    for (_b = 0, ixigoResults_1 = ixigoResults; _b < ixigoResults_1.length; _b++) {
                        r = ixigoResults_1[_b];
                        if (r.alias_type === "Alias" && r.label.endsWith(" Airport")) {
                            normalized = normalizeCityName(place.name);
                            iataCode = (_e = CITY_TO_IATA[normalized]) !== null && _e !== void 0 ? _e : place.name.toUpperCase();
                            airportLocations.push({ code: iataCode, name: r.label });
                        }
                    }
                    if (airportLocations.length > 0) {
                        place.flight = { airports: airportLocations };
                    }
                    return [3 /*break*/, 15];
                case 14:
                    err_3 = _f.sent();
                    console.error("resolvePlace ixigo flight enrichment for \"".concat(q, "\" failed:"), err_3);
                    return [3 /*break*/, 15];
                case 15:
                    if (!(!place.bus || place.bus.locations.length === 0)) return [3 /*break*/, 19];
                    _f.label = 16;
                case 16:
                    _f.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, (0, client_1.ixigoAutocomplete)(place.name)];
                case 17:
                    ixigoResults = _f.sent();
                    busLocations = [];
                    for (_c = 0, ixigoResults_2 = ixigoResults; _c < ixigoResults_2.length; _c++) {
                        r = ixigoResults_2[_c];
                        if (r.alias_type === "City" && normalizePlaceName(r.label) === place.normalizedName) {
                            busLocations.push({ name: r.label, provider: "ixigo" });
                        }
                    }
                    if (busLocations.length > 0) {
                        place.bus = { locations: busLocations };
                    }
                    return [3 /*break*/, 19];
                case 18:
                    err_4 = _f.sent();
                    console.error("resolvePlace ixigo enrichment for \"".concat(q, "\" failed:"), err_4);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/, place];
            }
        });
    });
}
