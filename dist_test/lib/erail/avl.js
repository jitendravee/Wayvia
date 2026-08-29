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
/** Builds the key erail.in/s.erail.in uses to identify a specific train+leg+class+quota+date. */
export function buildAvlKey(trainNo, from, to, travelClass, quota, date // month is 1-indexed (e.g. August = 8)
) {
    return `${trainNo}_${from}_${to}_${travelClass}_${quota}_${date.day}-${date.month}`;
}
/** 'YYYY-MM-DD' -> { day, month } with no leading zeros, matching the sample key format. */
export function toAvlDate(isoDate) {
    const [, mm, dd] = isoDate.split("-").map(Number);
    return { day: dd, month: mm };
}
function classifyStatus(status) {
    const s = status.trim().toUpperCase();
    if (s === "NOT AVAILABLE")
        return { category: "NOT_AVAILABLE", count: null };
    if (s.startsWith("AVAILABLE")) {
        const m = s.match(/AVAILABLE\s+(\d+)/);
        return { category: "AVAILABLE", count: m ? Number(m[1]) : null };
    }
    if (s.startsWith("REGRET"))
        return { category: "REGRET", count: null };
    if (s.includes("RAC")) {
        const m = s.match(/RAC\s*(\d+)?/);
        return { category: "RAC", count: m && m[1] ? Number(m[1]) : null };
    }
    if (s.includes("WL")) {
        // e.g. "GNWL4/WL1", "RLWL3/WL3", "PQWL26/WL14" - take the final /WLn as the position
        const m = s.match(/WL(\d+)(?!.*WL\d)/);
        return { category: "WAITLIST", count: m ? Number(m[1]) : null };
    }
    return { category: "UNKNOWN", count: null };
}
export function parseAvlResponse(rawDataField) {
    const availability = new Map();
    const fares = new Map();
    const segments = rawDataField.split("~").filter((s) => s.length > 0);
    for (const segment of segments) {
        if (segment.startsWith("301^AVL_Response") || segment === "301")
            continue; // header segment
        const parts = segment.split("^");
        if (parts.length < 2)
            continue;
        const [key, value1, value2] = parts;
        if (key.endsWith("_f")) {
            const baseKey = key.slice(0, -2);
            const fields = value1.split("_");
            const estimatedFare = fields.length > 8 && !Number.isNaN(Number(fields[8])) ? Number(fields[8]) : null;
            fares.set(baseKey, { key: baseKey, estimatedFare, raw: fields });
        }
        else {
            const { category, count } = classifyStatus(value1);
            availability.set(key, { key, category, count, rawStatus: value1, rawNums: value2 ?? "" });
        }
    }
    return { availability, fares };
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
export function buildAvlRequest(keys) {
    const withFareVariants = keys.flatMap((k) => [k, `${k}_f`]);
    const data = withFareVariants.join("~") + "~";
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
export async function fetchAvailability(keys) {
    if (keys.length === 0)
        return { availability: new Map(), fares: new Map() };
    const { url, init } = buildAvlRequest(keys);
    console.log("[ERAIL API] CALL");
    console.log("[ERAIL API] URL:", url);
    console.log("[ERAIL API] Method:", init.method);
    console.log("[ERAIL API] Keys:", keys.length);
    console.log("[ERAIL API] Requests in this call: 1");
    console.log("[ERAIL API] Keys:", keys);
    const start = Date.now();
    const res = await fetch(url, init);
    const rawText = await res.text();
    console.log("[ERAIL API] Status:", res.status);
    console.log("[ERAIL API] Duration:", `${Date.now() - start}ms`);
    let json;
    try {
        json = JSON.parse(rawText);
    }
    catch {
        throw new Error(`s.erail.in/getvalue did not return valid JSON (status ${res.status}). ` +
            `The request shape in buildAvlRequest() is a guess and likely doesn't match what the ` +
            `real site sends — capture the real request from DevTools and update buildAvlRequest(). ` +
            `Raw response (first 300 chars): ${rawText.slice(0, 300)}`);
    }
    if (!json.data) {
        throw new Error(`s.erail.in/getvalue returned JSON with no "data" field: ${rawText.slice(0, 300)}`);
    }
    return parseAvlResponse(json.data);
}
