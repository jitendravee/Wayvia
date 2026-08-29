/**
 * Shared fetch config for every ixigo call — these headers (in particular
 * x-app-name, Referer, Origin) are required; requests without them get
 * rejected or throttled differently by ixigo's edge. Centralized here so
 * the bus provider, /api/buses, and /api/bus-cities all send the exact
 * same identity instead of three slightly-different copies drifting apart.
 */
const IXIGO_HEADERS = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "x-app-name": "ixibusweb",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.ixigo.com/buses",
    Origin: "https://www.ixigo.com",
};
const AUTOCOMPLETE_URL = "https://www.ixigo.com/abus-autocompleter/api/v1/results";
const BUS_LIST_URL = "https://www.ixigo.com/wap/GetBusList";
/** City/place search — same endpoint the ixigo.com search box itself calls. Never throws; a bad/empty query or a network hiccup just returns []. */
export async function ixigoAutocomplete(query) {
    const q = query.trim();
    if (!q)
        return [];
    try {
        const res = await fetch(`${AUTOCOMPLETE_URL}?s=${encodeURIComponent(q)}`, {
            headers: IXIGO_HEADERS,
            // This is reference data (city ids barely ever change) — worth a short
            // cache at the fetch layer on top of the in-memory cache in
            // cityResolve.ts, so a cold process's first few searches aren't all
            // paying the full round trip individually.
            next: { revalidate: 3600 },
        });
        if (!res.ok)
            return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    }
    catch (err) {
        console.error("ixigoAutocomplete failed:", err);
        return [];
    }
}
/**
 * Bus service search. UNLIKE ixigoAutocomplete, this one DOES throw on
 * failure — a failed bus search needs to be distinguishable from "zero
 * buses on this route" by the caller (lib/providers/ixigoBus.ts), which
 * decides for itself whether to fail soft.
 */
export async function ixigoGetBusList(body) {
    const res = await fetch(BUS_LIST_URL, {
        method: "POST",
        headers: IXIGO_HEADERS,
        body: JSON.stringify(body),
        cache: "no-store", // seat/fare data — never cache
    });
    if (!res.ok) {
        throw new Error(`ixigo GetBusList failed with status ${res.status}`);
    }
    return (await res.json());
}
