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
exports.cityNameFromStationName = cityNameFromStationName;
exports.resolveIxigoCity = resolveIxigoCity;
var stations_1 = require("../../stations");
var client_1 = require("./client");
/** City ids are effectively permanent — a day's cache just saves a network round trip on every repeat search for the same city. */
var CACHE_TTL_MS = 24 * 60 * 60 * 1000;
var cache = new Map();
/**
 * "Pune Junction" -> "Pune"
 * "Secunderabad Junction, Hyderabad" -> "Hyderabad"
 * "Mumbai CSMT (Chhatrapati Shivaji)" -> "Mumbai"
 * "New Delhi" -> "New Delhi"
 *
 * Our station names are written for train travellers (junction names,
 * disambiguating parentheticals); ixigo's autocompleter wants a plain city
 * name. This strips the train-specific parts down to something a city
 * search will actually match.
 */
function cityNameFromStationName(name) {
    var n = name;
    // When a station name leads with the specific station and trails with the
    // city it serves (e.g. "Secunderabad Junction, Hyderabad"), the part after
    // the comma is the actual city.
    if (n.includes(","))
        n = n.split(",").pop().trim();
    n = n.replace(/\(.*?\)/g, "").trim();
    n = n.replace(/\b(Junction|Jn|Central|Terminus|Cantt|City|Town)\b\.?/gi, "").trim();
    n = n.replace(/\s{2,}/g, " ").trim();
    return n || name;
}
function scoreMatch(query, r) {
    var q = query.trim().toLowerCase();
    var label = r.label.trim().toLowerCase();
    var score = 0;
    // A plain "City" entry with stn_rfn=1 is the bookable, canonical record —
    // e.g. prefer Hyderabad (id 3, stn_rfn 1) over "Hyderabad Airport RGIA"
    // (stn_rfn 0) for a plain city-name query.
    if (r.alias_type === "City")
        score += 50;
    if (r.stn_rfn === 1)
        score += 20;
    if (label === q)
        score += 100;
    else if (label.startsWith(q))
        score += 40;
    else if (label.includes(q))
        score += 15;
    return score;
}
/**
 * Resolves a train station CODE — the only thing a ModeProvider gets handed
 * (see lib/providers/types.ts's ModeProvider.search signature) — to the
 * ixigo city record GetBusList needs. Two hops: our own station directory
 * turns the code into a human city name, then ixigo's own autocompleter
 * turns that name into an ixigo city id — the same lookup ixigo.com's own
 * search box does when someone types a city there.
 *
 * Never throws — an unresolvable city (typo, ixigo doesn't cover it, a
 * network hiccup) just returns null, and the bus provider treats that as
 * "no bus coverage for this pair" rather than failing the whole search.
 */
function resolveIxigoCity(stationCode) {
    return __awaiter(this, void 0, void 0, function () {
        var code, cached, value, stations, stationName, cityQuery_1, results, ranked, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    code = stationCode.trim().toUpperCase();
                    cached = cache.get(code);
                    if (cached && cached.expiresAt > Date.now())
                        return [2 /*return*/, cached.value];
                    value = null;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, stations_1.searchStations)(code, 1)];
                case 2:
                    stations = _c.sent();
                    stationName = (_b = (_a = stations[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : code;
                    cityQuery_1 = cityNameFromStationName(stationName);
                    return [4 /*yield*/, (0, client_1.ixigoAutocomplete)(cityQuery_1)];
                case 3:
                    results = _c.sent();
                    ranked = results
                        .map(function (r) { return ({ r: r, score: scoreMatch(cityQuery_1, r) }); })
                        .filter(function (x) { return x.score > 0; })
                        .sort(function (a, b) { return b.score - a.score; });
                    if (ranked.length > 0) {
                        value = { id: ranked[0].r.id, label: ranked[0].r.label };
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _c.sent();
                    console.error("resolveIxigoCity(".concat(code, ") failed:"), err_1);
                    value = null;
                    return [3 /*break*/, 5];
                case 5:
                    cache.set(code, { value: value, expiresAt: Date.now() + CACHE_TTL_MS });
                    return [2 /*return*/, value];
            }
        });
    });
}
