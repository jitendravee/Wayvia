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
exports.ALL_STATIONS_STATIC = void 0;
exports.searchStations = searchStations;
var hubs_1 = require("./graph/hubs");
var stationDirectory_1 = require("./erail/stationDirectory");
/**
 * Small curated seed list — kept for two reasons even now that station
 * search is live-backed: (1) it supplies nicer, disambiguated display names
 * ("Mumbai CSMT (Chhatrapati Shivaji)") than a raw timetable feed usually
 * has, and (2) it's the instant, zero-network fallback if erail.in's live
 * station asset is ever unreachable or returns an unrecognized shape — the
 * search box should never go blank just because a live fetch failed.
 */
var EXTRA_STATIONS = [
    { code: "BCT", name: "Mumbai Central", state: "Maharashtra" },
    { code: "CSMT", name: "Mumbai CSMT (Chhatrapati Shivaji)", state: "Maharashtra" },
    { code: "PUNE", name: "Pune Junction", state: "Maharashtra" },
    { code: "SBC", name: "Bengaluru City (KSR Bengaluru)", state: "Karnataka" },
    { code: "MAS", name: "Chennai Central", state: "Tamil Nadu" },
    { code: "HWH", name: "Howrah Junction, Kolkata", state: "West Bengal" },
    { code: "NDLS", name: "New Delhi", state: "Delhi" },
    { code: "SC", name: "Secunderabad Junction, Hyderabad", state: "Telangana" },
    { code: "JP", name: "Jaipur Junction", state: "Rajasthan" },
    { code: "ADI", name: "Ahmedabad Junction", state: "Gujarat" },
    { code: "LKO", name: "Lucknow Charbagh", state: "Uttar Pradesh" },
    { code: "PNBE", name: "Patna Junction", state: "Bihar" },
    { code: "BBS", name: "Bhubaneswar", state: "Odisha" },
    { code: "GHY", name: "Guwahati", state: "Assam" },
    { code: "TVC", name: "Thiruvananthapuram Central", state: "Kerala" },
    { code: "ERS", name: "Ernakulam Junction, Kochi", state: "Kerala" },
    { code: "MAO", name: "Madgaon, Goa", state: "Goa" },
    { code: "ASR", name: "Amritsar Junction", state: "Punjab" },
    { code: "CDG", name: "Chandigarh", state: "Chandigarh" },
    { code: "DDN", name: "Dehradun", state: "Uttarakhand" },
    { code: "JU", name: "Jodhpur Junction", state: "Rajasthan" },
    { code: "UDZ", name: "Udaipur City", state: "Rajasthan" },
    { code: "INDB", name: "Indore Junction", state: "Madhya Pradesh" },
    { code: "BPL", name: "Bhopal Junction", state: "Madhya Pradesh" },
    { code: "NGP", name: "Nagpur Junction", state: "Maharashtra" },
    { code: "VSKP", name: "Visakhapatnam", state: "Andhra Pradesh" },
    { code: "TPTY", name: "Tirupati", state: "Andhra Pradesh" },
    { code: "MYS", name: "Mysuru Junction", state: "Karnataka" },
    { code: "CBE", name: "Coimbatore Junction", state: "Tamil Nadu" },
    { code: "MDU", name: "Madurai Junction", state: "Tamil Nadu" },
];
/** Static fallback directory — used only if the live fetch fails entirely. */
var STATIC_SEED = (function () {
    var byCode = new Map();
    for (var _i = 0, DEFAULT_HUBS_1 = hubs_1.DEFAULT_HUBS; _i < DEFAULT_HUBS_1.length; _i++) {
        var h = DEFAULT_HUBS_1[_i];
        byCode.set(h.code, { code: h.code, name: h.name });
    }
    for (var _a = 0, EXTRA_STATIONS_1 = EXTRA_STATIONS; _a < EXTRA_STATIONS_1.length; _a++) {
        var s = EXTRA_STATIONS_1[_a];
        byCode.set(s.code, s);
    } // extra entries win — richer city names
    return Array.from(byCode.values());
})();
/**
 * Builds the full directory this request should search against: curated
 * seed + hub list, live erail.in station asset (cached ~6h), and whatever
 * this server process has learned from real train routes since it started.
 * Never throws — a failed live fetch just means the directory is a bit
 * smaller for this request, not that search breaks.
 */
function buildDirectory() {
    return __awaiter(this, void 0, void 0, function () {
        var byCode, _i, STATIC_SEED_1, s, live, _a, _b, live_1, s, _c, _d, s;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    byCode = new Map();
                    for (_i = 0, STATIC_SEED_1 = STATIC_SEED; _i < STATIC_SEED_1.length; _i++) {
                        s = STATIC_SEED_1[_i];
                        byCode.set(s.code, s);
                    }
                    live = [];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, stationDirectory_1.getLiveStations)()];
                case 2:
                    live = _e.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _e.sent();
                    live = [];
                    return [3 /*break*/, 4];
                case 4:
                    for (_b = 0, live_1 = live; _b < live_1.length; _b++) {
                        s = live_1[_b];
                        // Curated entries already have nicer names — don't overwrite those, only fill gaps.
                        if (!byCode.has(s.code))
                            byCode.set(s.code, s);
                    }
                    for (_c = 0, _d = (0, stationDirectory_1.getDiscoveredStations)(); _c < _d.length; _c++) {
                        s = _d[_c];
                        if (!byCode.has(s.code))
                            byCode.set(s.code, s);
                    }
                    return [2 /*return*/, Array.from(byCode.values())];
            }
        });
    });
}
/**
 * Ranks matches: exact code match first, then code-starts-with, then
 * name-starts-with, then name-contains. Keeps the dropdown feeling
 * "typeahead smart" rather than a plain filter.
 */
function searchStations(query_1) {
    return __awaiter(this, arguments, void 0, function (query, limit) {
        var q, directory, scored;
        if (limit === void 0) { limit = 8; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    q = query.trim().toUpperCase();
                    if (!q)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, buildDirectory()];
                case 1:
                    directory = (_a.sent()).filter(stationDirectory_1.looksLikeStation);
                    scored = directory
                        .map(function (s) {
                        var code = s.code.toUpperCase();
                        var name = s.name.toUpperCase();
                        var score = -1;
                        if (code === q)
                            score = 100;
                        else if (code.startsWith(q))
                            score = 80;
                        else if (name.startsWith(q))
                            score = 60;
                        else if (name.includes(q))
                            score = 40;
                        else if (code.includes(q))
                            score = 20;
                        return { s: s, score: score };
                    })
                        .filter(function (x) { return x.score > 0; });
                    scored.sort(function (a, b) { return b.score - a.score || a.s.name.localeCompare(b.s.name); });
                    return [2 /*return*/, scored.slice(0, limit).map(function (x) { return x.s; })];
            }
        });
    });
}
/** Sync, static-only list — for places that need a station name without an async round trip (e.g. server components rendering hub badges). */
exports.ALL_STATIONS_STATIC = __spreadArray([], STATIC_SEED, true).sort(function (a, b) { return a.name.localeCompare(b.name); });
