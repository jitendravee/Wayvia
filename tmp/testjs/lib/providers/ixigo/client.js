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
exports.ixigoAutocomplete = ixigoAutocomplete;
exports.ixigoGetBusList = ixigoGetBusList;
exports.ixigoGetFlightList = ixigoGetFlightList;
/**
 * Shared fetch config for every ixigo call — these headers (in particular
 * x-app-name, Referer, Origin) are required; requests without them get
 * rejected or throttled differently by ixigo's edge. Centralized here so
 * the bus provider, /api/buses, and /api/bus-cities all send the exact
 * same identity instead of three slightly-different copies drifting apart.
 */
var IXIGO_HEADERS = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "x-app-name": "ixibusweb",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.ixigo.com/buses",
    Origin: "https://www.ixigo.com",
};
var AUTOCOMPLETE_URL = "https://www.ixigo.com/abus-autocompleter/api/v1/results";
var BUS_LIST_URL = "https://www.ixigo.com/wap/GetBusList";
/** City/place search — same endpoint the ixigo.com search box itself calls. Never throws; a bad/empty query or a network hiccup just returns []. */
function ixigoAutocomplete(query) {
    return __awaiter(this, void 0, void 0, function () {
        var q, res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    q = query.trim();
                    if (!q)
                        return [2 /*return*/, []];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(AUTOCOMPLETE_URL, "?s=").concat(encodeURIComponent(q)), {
                            headers: IXIGO_HEADERS,
                            // This is reference data (city ids barely ever change) — worth a short
                            // cache at the fetch layer on top of the in-memory cache in
                            // cityResolve.ts, so a cold process's first few searches aren't all
                            // paying the full round trip individually.
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    return [2 /*return*/, Array.isArray(data) ? data : []];
                case 4:
                    err_1 = _a.sent();
                    console.error("ixigoAutocomplete failed:", err_1);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Bus service search. UNLIKE ixigoAutocomplete, this one DOES throw on
 * failure — a failed bus search needs to be distinguishable from "zero
 * buses on this route" by the caller (lib/providers/ixigoBus.ts), which
 * decides for itself whether to fail soft.
 */
function ixigoGetBusList(body) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(BUS_LIST_URL, {
                        method: "POST",
                        headers: IXIGO_HEADERS,
                        body: JSON.stringify(body),
                        cache: "no-store", // seat/fare data — never cache
                    })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("ixigo GetBusList failed with status ".concat(res.status));
                    }
                    return [4 /*yield*/, res.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
/**
 * Flight fare calendar search. Returns a list of fares for each day in a
 * range. Note: this endpoint does not return flight times; times must be
 * obtained from another endpoint or assumed. For now, we leave times as
 * placeholders and rely on the fare and availability.
 */
function ixigoGetFlightList(params) {
    return __awaiter(this, void 0, void 0, function () {
        var query, url, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = new URLSearchParams(params).toString();
                    url = "https://www.ixigo.com/outlook/v1/onward/ranged?".concat(query);
                    return [4 /*yield*/, fetch(url, { headers: IXIGO_HEADERS })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error("ixigo flight list failed with status ".concat(res.status));
                    return [4 /*yield*/, res.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
