"use strict";
/**
 * Live station directory.
 *
 * erail.in doesn't publish a documented "give me every station" REST
 * endpoint, but it ships a static JS asset that its own front-end loads for
 * autocomplete: https://erail.in/js5/IRTrains.js (the exact filename is
 * user-supplied; despite the "IRTrains" name it's the same family of static
 * lookup asset as the AUTOCOMPLETE/GetTrain endpoints elsewhere in this
 * codebase). This sandbox has no network egress to erail.in, so the exact
 * byte-for-byte shape of that asset could not be confirmed here — the
 * parser below is written defensively against the shapes erail.in is known
 * to use elsewhere in this codebase (see lib/erail/trainSearch.ts and
 * lib/erail/prettify.ts for the same pattern):
 *
 *   1. Plain JSON (array of records, or an object with a data/list field).
 *   2. A `var x = [...]` / `x[0]="...";` JS literal — pulled out with a
 *      regex over quoted string literals, never eval'd.
 *   3. erail's other convention: a "~~~~~~~~"-separated list of "~"-joined
 *      fields (same shape BetweenStation uses in prettify.ts).
 *
 * Every record is normalized to { code, name, state? }. If none of the
 * three shapes match anything, callers fall back to the small curated list
 * in lib/stations.ts, so autocomplete and routing keep working even if this
 * asset's format turns out to be different in production — verify against
 * a live response and tighten the parser if entries come back empty.
 *
 * SECOND ROLE — growing directory: lib/graph/dynamicHubs.ts calls
 * registerDiscoveredStations() with the real intermediate stops it reads
 * off actual train routes (via getRoute()). Those are merged in immediately
 * for the lifetime of the server process. This is what replaces the old
 * fixed ~34-station hub list: every real search that has to reach past the
 * curated hubs teaches the directory (and therefore autocomplete, and
 * therefore future hub search) about more of the real network.
 */
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
exports.looksLikeStation = looksLikeStation;
exports.getLiveStations = getLiveStations;
exports.registerDiscoveredStations = registerDiscoveredStations;
exports.getDiscoveredStations = getDiscoveredStations;
exports.discoveredStationCount = discoveredStationCount;
/**
 * The live asset this file scrapes is undocumented (see the big comment
 * below) and, going by its own filename, is at least partly a *train* list
 * rather than a pure station list. Every parser below is a generic
 * "CODE~NAME" / "CODE - NAME" pattern-matcher, so without a filter it will
 * happily accept a train entry like "12951~MUMBAI RAJDHANI" as if it were a
 * station — which is exactly what was showing up as train numbers/names
 * inside the station search box. This guard rejects anything that looks
 * like a train record before it ever reaches the directory:
 *   - real IR station codes are alphabetic (2-6 letters); train numbers are
 *     purely numeric (4-5 digits), so a numeric-only "code" is never a
 *     station.
 *   - train *names* almost always contain a service-type word (EXPRESS,
 *     MAIL, PASSENGER, SUPERFAST, RAJDHANI, ...) that a station name never
 *     legitimately contains.
 */
var TRAIN_NAME_HINTS = /\b(EXPRESS|EXP|MAIL|PASSENGER|PASS|SPECIAL|SPL|SUPERFAST|SF|RAJDHANI|SHATABDI|DURONTO|GARIB\s*RATH|HUMSAFAR|JANSHATABDI|JAN\s*SHATABDI|VANDE\s*BHARAT|INTERCITY|SUVIDHA|ANTYODAYA|TEJAS|SAMPARK\s*KRANTI|YUVA|UDAY|AC\s*EXP)\b/i;
function looksLikeStation(rec) {
    var _a, _b, _c, _d;
    var code = (_b = (_a = rec.code) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase()) !== null && _b !== void 0 ? _b : "";
    var name = (_d = (_c = rec.name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    if (!code || !name)
        return false;
    // Station codes are alphabetic (occasionally with a trailing digit e.g. "H NZM" variants,
    // but never *only* digits). Train numbers are purely numeric — reject those outright.
    if (/^\d+$/.test(code))
        return false;
    if (!/^[A-Z0-9]{2,8}$/.test(code))
        return false;
    if (!/[A-Z]/.test(code))
        return false;
    if (TRAIN_NAME_HINTS.test(name))
        return false;
    return true;
}
var STATION_LIST_URL = "https://erail.in/js5/IRTrains.js";
var CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — this is a near-static asset
var liveCache = null;
var inFlight = null;
/** Grows for the life of the process. Not persisted — a restart just means the directory re-learns from live searches. */
var discovered = new Map();
function ua() {
    return "Mozilla/5.0 (compatible; WayviaBot/1.0; +journey-search)";
}
function tryJsonShape(text) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    var json;
    try {
        json = JSON.parse(text);
    }
    catch (_o) {
        return null;
    }
    var arr = Array.isArray(json)
        ? json
        : json && typeof json === "object"
            ? (_b = (_a = json.data) !== null && _a !== void 0 ? _a : json.stations) !== null && _b !== void 0 ? _b : json.list
            : null;
    if (!Array.isArray(arr))
        return null;
    var out = [];
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var item = arr_1[_i];
        if (typeof item === "string") {
            // e.g. "NDLS - NEW DELHI" or "NDLS~NEW DELHI"
            var m = item.match(/^\s*([A-Z0-9]{2,6})\s*[-~]\s*(.+?)\s*$/i);
            if (m)
                out.push({ code: m[1].toUpperCase(), name: titleCase(m[2]) });
            continue;
        }
        if (!item || typeof item !== "object")
            continue;
        var rec = item;
        var code = String((_f = (_e = (_d = (_c = rec.code) !== null && _c !== void 0 ? _c : rec.Code) !== null && _d !== void 0 ? _d : rec.station_code) !== null && _e !== void 0 ? _e : rec.StationCode) !== null && _f !== void 0 ? _f : "").trim().toUpperCase();
        var name_1 = String((_k = (_j = (_h = (_g = rec.name) !== null && _g !== void 0 ? _g : rec.Name) !== null && _h !== void 0 ? _h : rec.station_name) !== null && _j !== void 0 ? _j : rec.StationName) !== null && _k !== void 0 ? _k : "").trim();
        if (!code || !name_1)
            continue;
        var state = ((_l = rec.state) !== null && _l !== void 0 ? _l : rec.State) ? String((_m = rec.state) !== null && _m !== void 0 ? _m : rec.State).trim() : undefined;
        out.push({ code: code, name: titleCase(name_1), state: state });
    }
    var filtered = out.filter(looksLikeStation);
    return filtered.length ? filtered : null;
}
function tryJsLiteralShape(text) {
    // Pull every quoted string literal out of the JS source without eval'ing it,
    // then try to read each as "CODE~NAME[~STATE]" or "CODE-NAME".
    var literals = __spreadArray([], text.matchAll(/["']([^"']{3,120})["']/g), true).map(function (m) { return m[1]; });
    if (!literals.length)
        return null;
    var out = [];
    for (var _i = 0, literals_1 = literals; _i < literals_1.length; _i++) {
        var lit = literals_1[_i];
        if (lit.includes("~")) {
            var fields = lit.split("~").filter(Boolean);
            var code = fields.find(function (f) { return /^[A-Z0-9]{2,6}$/.test(f); });
            if (!code)
                continue;
            var idx = fields.indexOf(code);
            var name_2 = fields[idx + 1];
            if (!name_2 || !/[A-Za-z]/.test(name_2))
                continue;
            out.push({ code: code, name: titleCase(name_2), state: fields[idx + 2] });
        }
        else {
            var m = lit.match(/^([A-Z0-9]{2,6})\s*-\s*(.+)$/);
            if (m)
                out.push({ code: m[1], name: titleCase(m[2]) });
        }
    }
    var filtered = out.filter(looksLikeStation);
    return filtered.length ? filtered : null;
}
function tryTildeBlockShape(text) {
    var _a;
    if (!text.includes("~~~~~~~~"))
        return null;
    var out = [];
    for (var _i = 0, _b = text.split("~~~~~~~~"); _i < _b.length; _i++) {
        var chunk = _b[_i];
        var fields = chunk.split("~").filter(Boolean);
        var code = fields.find(function (f) { return /^[A-Z0-9]{2,6}$/.test(f); });
        if (!code)
            continue;
        var idx = fields.indexOf(code);
        var name_3 = (_a = fields[idx + 1]) !== null && _a !== void 0 ? _a : fields[idx - 1];
        if (!name_3)
            continue;
        out.push({ code: code, name: titleCase(name_3) });
    }
    var filtered = out.filter(looksLikeStation);
    return filtered.length ? filtered : null;
}
function titleCase(s) {
    return s
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
/**
 * Fetches + parses the live station asset, cached for CACHE_TTL_MS.
 * Never throws — returns [] on any network/parse failure so callers can
 * always fall back to the curated list without extra error handling.
 */
function getLiveStations() {
    return __awaiter(this, void 0, void 0, function () {
        var now;
        var _this = this;
        return __generator(this, function (_a) {
            now = Date.now();
            if (liveCache && now - liveCache.fetchedAt < CACHE_TTL_MS)
                return [2 /*return*/, liveCache.stations];
            if (inFlight)
                return [2 /*return*/, inFlight];
            inFlight = (function () { return __awaiter(_this, void 0, void 0, function () {
                var res, text, stations, _a;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 3, 4, 5]);
                            return [4 /*yield*/, fetch("".concat(STATION_LIST_URL, "?_=").concat(new Date().toISOString().slice(0, 10)), {
                                    headers: { "User-Agent": ua(), Accept: "*/*" },
                                    cache: "no-store",
                                    signal: AbortSignal.timeout(5000),
                                })];
                        case 1:
                            res = _e.sent();
                            return [4 /*yield*/, res.text()];
                        case 2:
                            text = _e.sent();
                            stations = (_d = (_c = (_b = tryJsonShape(text)) !== null && _b !== void 0 ? _b : tryTildeBlockShape(text)) !== null && _c !== void 0 ? _c : tryJsLiteralShape(text)) !== null && _d !== void 0 ? _d : [];
                            liveCache = { stations: stations, fetchedAt: Date.now() };
                            return [2 /*return*/, stations];
                        case 3:
                            _a = _e.sent();
                            // Keep serving a stale cache if we have one rather than going empty on a transient failure.
                            if (liveCache)
                                return [2 /*return*/, liveCache.stations];
                            liveCache = { stations: [], fetchedAt: Date.now() };
                            return [2 /*return*/, []];
                        case 4:
                            inFlight = null;
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); })();
            return [2 /*return*/, inFlight];
        });
    });
}
/** Merges real stops read off an actual train route into the growing in-process directory. */
function registerDiscoveredStations(stops) {
    var _a, _b;
    for (var _i = 0, stops_1 = stops; _i < stops_1.length; _i++) {
        var s = stops_1[_i];
        var code = (_a = s.code) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
        var name_4 = (_b = s.name) === null || _b === void 0 ? void 0 : _b.trim();
        if (!code || !name_4)
            continue;
        if (!looksLikeStation({ code: code, name: name_4 }))
            continue;
        if (!discovered.has(code)) {
            discovered.set(code, { code: code, name: titleCase(name_4) });
        }
    }
}
function getDiscoveredStations() {
    return Array.from(discovered.values());
}
function discoveredStationCount() {
    return discovered.size;
}
