"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCountriesDevPlace = normalizeCountriesDevPlace;
exports.fetchCountriesDevPlaces = fetchCountriesDevPlaces;
/**
 * Normalizes a countries.dev city response to our canonical Place model
 */
function normalizeCountriesDevPlace(city, query) {
    return {
        id: "place_".concat(city.geonameId),
        name: city.name,
        normalizedName: city.name.toLowerCase(),
        latitude: city.latitude,
        longitude: city.longitude,
        hasCoords: true,
        // countries.dev only gives us a country CODE, not a name. Fine to
        // hardcode here since callers currently filter to countryCode === "IN"
        // before this runs; revisit if this ever serves non-India results.
        country: city.countryCode === "IN" ? "India" : city.countryCode,
        // No human-readable state name is available from this API — only a
        // numeric admin1Code (e.g. "09"). Left undefined rather than guessing;
        // add a geonames admin1-code -> state-name table here if that's needed.
        state: undefined,
        type: determinePlaceType(city),
        // Transport locations will be resolved separately by the resolver
        railway: { stations: [] },
        bus: { locations: [] },
        flight: { airports: [] },
        isHub: false // Hub status determined by resolver based on geo seed
    };
}
/**
 * Determines the place type based on feature code and other attributes
 */
function determinePlaceType(city) {
    // countries.dev feature codes for populated places
    switch (city.featureCode) {
        case "PPLA": // Seat of a first-order administrative division
        case "PPLA2": // Seat of a second-order administrative division
        case "PPLA3": // Seat of a third-order administrative division
        case "PPLA4": // Seat of a fourth-order administrative division
            return "city";
        case "PPL": // Populated place
        case "PPLL": // Populated locality
            // Further refine based on population
            if (city.population >= 100000)
                return "city";
            if (city.population >= 10000)
                return "town";
            return "village";
        case "STL": // Former populated place
        case "PPLX": // Section of populated place
            return "town";
        case "RGN": // Region
            return "region";
        default:
            // Fallback based on population
            if (city.population >= 500000)
                return "city";
            if (city.population >= 50000)
                return "town";
            if (city.population >= 5000)
                return "village";
            return "region";
    }
}
/**
 * Fetches places from countries.dev API
 */
function fetchCountriesDevPlaces(query_1) {
    return __awaiter(this, arguments, void 0, function (query, limit) {
        var url, response, data, error_1;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    url = "https://countries.dev/cities?q=".concat(encodeURIComponent(query), "&limit=").concat(limit);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    // Treat 404 as "no results found" rather than an error
                    if (!response.ok && response.status !== 404) {
                        throw new Error("countries.dev API error: ".concat(response.status));
                    }
                    // If we get a 404 or non-JSON response, return empty array
                    if (response.status === 404) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    // Normalize each city to our Place model
                    return [2 /*return*/, data.map(function (city) { return normalizeCountriesDevPlace(city, query); })];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error fetching places from countries.dev:", error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
