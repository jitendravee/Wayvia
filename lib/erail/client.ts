import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import Prettify from "./prettify";
import type {
  BetweenStationEntry,
  CheckTrainResult,
  RouteStop,
  LiveStationEntry,
  ParsedResult,
} from "./prettify";

const prettify = new Prettify();

function ua() {
  return new UserAgent().toString();
}

export async function getTrain(trainNo: string): Promise<ParsedResult<CheckTrainResult | string> | undefined> {
  const url = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url, { headers: { "User-Agent": ua() } });
  const text = await res.text();
  return prettify.CheckTrain(text);
}

export async function betweenStations(
  from: string,
  to: string
): Promise<ParsedResult<BetweenStationEntry[] | string> | undefined> {
  const url = `https://erail.in/rail/getTrains.aspx?Station_From=${from}&Station_To=${to}&DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url, { headers: { "User-Agent": ua() } });
  const text = await res.text();
  return prettify.BetweenStation(text);
}

/**
 * Filters betweenStations results down to trains actually running on the
 * given DD-MM-YYYY date, using erail's running_days convention.
 */
export async function getTrainsOnDate(
  from: string,
  to: string,
  date: string // 'DD-MM-YYYY'
): Promise<ParsedResult<BetweenStationEntry[] | string>> {
  const json = await betweenStations(from, to);
  if (!json || !json.success) {
    return (json as ParsedResult<string>) ?? { success: false, time_stamp: Date.now(), data: "No response" };
  }
  const [DD, MM, YYYY] = date.split("-");
  const day = prettify.getDayOnDate(DD, MM, YYYY);
  const entries = json.data as BetweenStationEntry[];
  const filtered = entries.filter((e) => e.train_base.running_days[day] === "1");
  return { success: true, time_stamp: Date.now(), data: filtered };
}

export async function getRoute(trainNo: string): Promise<ParsedResult<RouteStop[]> | ParsedResult<string> | undefined> {
  const infoUrl = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
  const infoRes = await fetch(infoUrl, { headers: { "User-Agent": ua() } });
  const infoText = await infoRes.text();
  const info = prettify.CheckTrain(infoText);
  if (!info || !info.success) return info as ParsedResult<string> | undefined;

  const trainId = (info.data as CheckTrainResult).train_id;
  const routeUrl = `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${trainId}&Data2=0&Cache=true`;
  const routeRes = await fetch(routeUrl, { headers: { "User-Agent": ua() } });
  const routeText = await routeRes.text();
  return prettify.GetRoute(routeText);
}

export async function stationLive(code: string): Promise<ParsedResult<LiveStationEntry[]>> {
  const url = `https://erail.in/station-live/${code}?DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url, { headers: { "User-Agent": ua() } });
  const text = await res.text();
  const $ = cheerio.load(text);
  return prettify.LiveStation($);
}

export async function pnrStatus(pnr: string) {
  const url = `https://www.confirmtkt.com/pnr-status/${pnr}`;
  const res = await fetch(url, { headers: { "User-Agent": ua() } });
  const text = await res.text();
  return prettify.PnrStatus(text);
}
