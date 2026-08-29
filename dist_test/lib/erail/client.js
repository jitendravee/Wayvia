import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import Prettify from "./prettify";
const prettify = new Prettify();
function ua() {
    return new UserAgent().toString();
}
export async function getTrain(trainNo) {
    const url = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
    const res = await fetch(url, { headers: { "User-Agent": ua() } });
    const text = await res.text();
    return prettify.CheckTrain(text);
}
export async function betweenStations(from, to) {
    const url = `https://erail.in/rail/getTrains.aspx?Station_From=${from}&Station_To=${to}&DataSource=0&Language=0&Cache=true`;
    const res = await fetch(url, { headers: { "User-Agent": ua() } });
    const text = await res.text();
    return prettify.BetweenStation(text);
}
/**
 * Filters betweenStations results down to trains actually running on the
 * given DD-MM-YYYY date, using erail's running_days convention.
 */
export async function getTrainsOnDate(from, to, date // 'DD-MM-YYYY'
) {
    const json = await betweenStations(from, to);
    if (!json || !json.success) {
        return json ?? { success: false, time_stamp: Date.now(), data: "No response" };
    }
    const [DD, MM, YYYY] = date.split("-");
    const day = prettify.getDayOnDate(DD, MM, YYYY);
    const entries = json.data;
    const filtered = entries.filter((e) => e.train_base.running_days[day] === "1");
    return { success: true, time_stamp: Date.now(), data: filtered };
}
export async function getRoute(trainNo) {
    const infoUrl = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
    const infoRes = await fetch(infoUrl, { headers: { "User-Agent": ua() } });
    const infoText = await infoRes.text();
    const info = prettify.CheckTrain(infoText);
    if (!info || !info.success)
        return info;
    const trainId = info.data.train_id;
    const routeUrl = `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${trainId}&Data2=0&Cache=true`;
    const routeRes = await fetch(routeUrl, { headers: { "User-Agent": ua() } });
    const routeText = await routeRes.text();
    return prettify.GetRoute(routeText);
}
export async function stationLive(code) {
    const url = `https://erail.in/station-live/${code}?DataSource=0&Language=0&Cache=true`;
    const res = await fetch(url, { headers: { "User-Agent": ua() } });
    const text = await res.text();
    const $ = cheerio.load(text);
    return prettify.LiveStation($);
}
/**
 * PNR status. Tries erail.in's own PNR page first — https://erail.in/pnr-status/{pnr}
 * is a server-rendered page in the same family as the running-status page
 * (lib/erail/runningStatus.ts), and erail's own client-side JS reads the
 * result back out of a `data = {...};` block embedded in the page (that's
 * what the PNR_Save call in the wild is re-posting, not fetching — so the
 * real data has to already be in this initial HTML). This sandbox has no
 * network egress to erail.in, so that assumption is untested; if erail.in's
 * PNR page doesn't actually embed the data this way, this falls back to the
 * previously-working confirmtkt.com scrape.
 */
export async function pnrStatus(pnr) {
    try {
        const url = `https://erail.in/pnr-status/${pnr}`;
        const res = await fetch(url, {
            headers: { "User-Agent": ua(), Accept: "text/html" },
            cache: "no-store",
        });
        const text = await res.text();
        const parsed = prettify.PnrStatus(text);
        if (parsed?.data)
            return parsed;
        throw new Error("erail.in PNR page did not contain an embedded data block");
    }
    catch {
        const url = `https://www.confirmtkt.com/pnr-status/${pnr}`;
        const res = await fetch(url, { headers: { "User-Agent": ua() } });
        const text = await res.text();
        return prettify.PnrStatus(text);
    }
}
