"use strict";
/**
 * s.erail.in/getvalue — seat availability + fare data.
 *
 * The RESPONSE format below is reverse-engineered from a real sample the
 * user captured (not guessed) — the parser here is tested against that
 * literal sample in scripts/test-avl-parser.ts.
 *
 * The REQUEST format is now CONFIRMED — captured directly from a real
 * browser session against erail.in (see buildAvlRequest below). Body is
 * JSON: {"Action":"AVL_Data","Data":"key1~key2~key1_f~key2_f~..."}. Note
 * that fare data for a leg only comes back if you also request the
 * "<key>_f" variant alongside the plain key — buildAvlRequest() does this
 * automatically for every key passed in.
 *
 * Response shape (confirmed from sample):
 *   { "action": "AVL_Data", "data": "301^AVL_Response~KEY^STATUS^NUMS~..." }
 *
 * Within `data`, segments are '~'-separated. Each segment is '^'-separated:
 *   - Availability entry: KEY ^ STATUS ^ NUMS
 *       KEY  = "<trainNo>_<from>_<to>_<class>_<quota>_<D-M>"
 *              e.g. "12908_NZM_BDTS_1A_GN_17-8"
 *       STATUS = "NOT AVAILABLE" | "AVAILABLE 14" | "GNWL4/WL1" |
 *                 "RLWL3/WL3" | "PQWL26/WL14" | "REGRET/GNWL12" | ...
 *       NUMS = two dash-separated numbers, meaning unconfirmed
 *              (kept as raw string, not parsed further)
 *   - Fare entry: KEY ends in "_f", e.g. "12908_NZM_BDTS_1A_GN_17-8_f"
 *       VALUE1 = underscore-separated numeric fields. Field semantics are
 *       NOT officially documented; index 8 is used here as an estimated
 *       all-in fare based on pattern-matching the sample (it's
 *       consistently the largest early-position number, e.g. 3970 for a
 *       1A fare where the base was 3646). Treat `estimatedFare` as
 *       approximate, and keep `raw` around so you can re-derive a better
 *       formula once you can cross-check against a real booking.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAvlKey = buildAvlKey;
exports.toAvlDate = toAvlDate;
exports.parseAvlResponse = parseAvlResponse;
exports.buildAvlRequest = buildAvlRequest;
exports.fetchAvailability = fetchAvailability;
/** Builds the key erail.in/s.erail.in uses to identify a specific train+leg+class+quota+date. */
function buildAvlKey(trainNo, from, to, travelClass, quota, date // month is 1-indexed (e.g. August = 8)
) {
    return "".concat(trainNo, "_").concat(from, "_").concat(to, "_").concat(travelClass, "_").concat(quota, "_").concat(date.day, "-").concat(date.month);
}
/** 'YYYY-MM-DD' -> { day, month } with no leading zeros, matching the sample key format. */
function toAvlDate(isoDate) {
    var _a = isoDate.split("-").map(Number), mm = _a[1], dd = _a[2];
    return { day: dd, month: mm };
}
function classifyStatus(status) {
    var s = status.trim().toUpperCase();
    if (s === "NOT AVAILABLE")
        return { category: "NOT_AVAILABLE", count: null };
    if (s.startsWith("AVAILABLE")) {
        var m = s.match(/AVAILABLE\s+(\d+)/);
        return { category: "AVAILABLE", count: m ? Number(m[1]) : null };
    }
    if (s.startsWith("REGRET"))
        return { category: "REGRET", count: null };
    if (s.includes("RAC")) {
        var m = s.match(/RAC\s*(\d+)?/);
        return { category: "RAC", count: m && m[1] ? Number(m[1]) : null };
    }
    if (s.includes("WL")) {
        // e.g. "GNWL4/WL1", "RLWL3/WL3", "PQWL26/WL14" - take the final /WLn as the position
        var m = s.match(/WL(\d+)(?!.*WL\d)/);
        return { category: "WAITLIST", count: m ? Number(m[1]) : null };
    }
    return { category: "UNKNOWN", count: null };
}
function parseAvlResponse(rawDataField) {
    var availability = new Map();
    var fares = new Map();
    var segments = rawDataField.split("~").filter(function (s) { return s.length > 0; });
    for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
        var segment = segments_1[_i];
        if (segment.startsWith("301^AVL_Response") || segment === "301")
            continue; // header segment
        var parts = segment.split("^");
        if (parts.length < 2)
            continue;
        var key = parts[0], value1 = parts[1], value2 = parts[2];
        if (key.endsWith("_f")) {
            var baseKey = key.slice(0, -2);
            var fields = value1.split("_");
            var estimatedFare = fields.length > 8 && !Number.isNaN(Number(fields[8])) ? Number(fields[8]) : null;
            fares.set(baseKey, { key: baseKey, estimatedFare: estimatedFare, raw: fields });
        }
        else {
            var _a = classifyStatus(value1), category = _a.category, count = _a.count;
            availability.set(key, { key: key, category: category, count: count, rawStatus: value1, rawNums: value2 !== null && value2 !== void 0 ? value2 : "" });
        }
    }
    return { availability: availability, fares: fares };
}
/**
 * Confirmed via a captured real request (browser DevTools -> Network ->
 * Copy as fetch on erail.in). Key details that differed from the earlier
 * guess:
 *   - Body is JSON, not form-urlencoded: {"Action":"AVL_Data","Data":"..."}
 *   - Data is '~'-joined (not '|'), with a trailing '~'
 *   - For every leg you want fare data on, you must ALSO include a
 *     "<key>_f" entry in Data — the plain key alone only gets you
 *     availability, not fare.
 *   - Referer: https://erail.in/ is sent; keeping it in case the server
 *     checks it.
 */
function buildAvlRequest(keys) {
    var withFareVariants = keys.flatMap(function (k) { return [k, "".concat(k, "_f")]; });
    var data = withFareVariants.join("~") + "~";
    return {
        url: "https://s.erail.in/getvalue",
        init: {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json",
                referer: "https://erail.in/",
            },
            body: JSON.stringify({ Action: "AVL_Data", Data: data }),
        },
    };
}
function fetchAvailability(keys) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, url, init, start, res, rawText, json;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (keys.length === 0)
                        return [2 /*return*/, { availability: new Map(), fares: new Map() }];
                    _a = buildAvlRequest(keys), url = _a.url, init = _a.init;
                    console.log("[ERAIL API] CALL");
                    console.log("[ERAIL API] URL:", url);
                    console.log("[ERAIL API] Method:", init.method);
                    console.log("[ERAIL API] Keys:", keys.length);
                    console.log("[ERAIL API] Requests in this call: 1");
                    console.log("[ERAIL API] Keys:", keys);
                    start = Date.now();
                    return [4 /*yield*/, fetch(url, init)];
                case 1:
                    res = _b.sent();
                    return [4 /*yield*/, res.text()];
                case 2:
                    rawText = _b.sent();
                    console.log("[ERAIL API] Status:", res.status);
                    console.log("[ERAIL API] Duration:", "".concat(Date.now() - start, "ms"));
                    try {
                        json = JSON.parse(rawText);
                    }
                    catch (_c) {
                        throw new Error("s.erail.in/getvalue did not return valid JSON (status ".concat(res.status, "). ") +
                            "The request shape in buildAvlRequest() is a guess and likely doesn't match what the " +
                            "real site sends \u2014 capture the real request from DevTools and update buildAvlRequest(). " +
                            "Raw response (first 300 chars): ".concat(rawText.slice(0, 300)));
                    }
                    if (!json.data) {
                        throw new Error("s.erail.in/getvalue returned JSON with no \"data\" field: ".concat(rawText.slice(0, 300)));
                    }
                    return [2 /*return*/, parseAvlResponse(json.data)];
            }
        });
    });
}
