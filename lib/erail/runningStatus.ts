/**
 * Parser for erail.in's mobile "train running status" page
 * (https://erail.in/train-running-status/{trainNo}).
 *
 * Unlike the other endpoints in this folder (which return a tilde-delimited
 * pseudo-CSV), this one returns actual — if deeply malformed — HTML: nested
 * <tr>/<td> tags that are never closed. Browsers (and cheerio, via
 * htmlparser2) auto-correct that into a sane DOM, so we can walk it with
 * normal selectors.
 *
 * This parser was built and unit-tested offline against a real saved
 * response for train 10103 (MANDOVI EXPRESS), including its "en route"
 * state (already departed one station, live position marker between two
 * stops). The exact row shape (Platform / Scheduled / Act-Exp / Delay,
 * arrival block then departure block, "First"/"Last" instead of a time at
 * the origin/destination, the divTrainImg marker row, and the
 * .divRakeMobile coach strip) all matched cleanly. Trains in other states
 * (not yet started, terminated, no live data available) could not be
 * verified against this sandbox's lack of network access to erail.in — if
 * erail returns a differently-shaped page for those, the defensive
 * fallbacks below (empty arrays, undefined fields) should keep this from
 * throwing, but the specific copy of `notFound`/error messages may need
 * adjusting against a real response.
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import UserAgent from "user-agents";

export interface RunningStatusStop {
  station: string;
  platform?: string;
  isOrigin: boolean;
  isDestination: boolean;
  arrival: { time: string | null; delayed: boolean | null } | null;
  departure: { time: string | null; delayed: boolean | null } | null;
  arrivalDelayMin: number | null;
  departureDelayMin: number | null;
  major: boolean;
  status: "departed" | "current" | "upcoming";
}

export interface RunningStatusPosition {
  raw: string;
  afterStation: string | null;
  atTime: string | null;
  towardsStation: string | null;
  towardsDistanceKm: number | null;
}

export interface RunningStatusSummary {
  platform: string | null;
  arrival: { scheduled: string | null; actual: string | null; delayMin: number | null };
  departure: { scheduled: string | null; actual: string | null; delayMin: number | null };
  nextStoppingStation: string | null;
  nextStationNonStop: string | null;
  lastUpdated: string | null;
  statusMessage: string | null;
}

export interface RunningStatusResult {
  success: boolean;
  trainNo: string;
  trainName: string | null;
  runDate: string | null;
  summary: RunningStatusSummary | null;
  position: RunningStatusPosition | null;
  stations: RunningStatusStop[];
  rake: string[];
  notFound?: boolean;
  message?: string;
}

function cellText($: cheerio.CheerioAPI, el: AnyNode): string {
  return $(el).text().replace(/\s+/g, " ").trim();
}

function parseDelayMin(label: string): number | null {
  // "52m" -> 52. Also tolerates "1h 5m" / "01:05" just in case.
  const m = /(\d+)h\D*(\d+)m/.exec(label);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const mm = /^(\d+)m$/.exec(label);
  if (mm) return Number(mm[1]);
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(label);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
  return null;
}

function isDelayedColor(style: string | undefined): boolean | null {
  if (!style) return null;
  if (style.includes("color:red")) return true;
  if (style.includes("color:green")) return false;
  return null;
}

export function parseRunningStatusHtml(html: string, trainNo: string): RunningStatusResult {
  const $ = cheerio.load(html);

  const h1 = $("#masterH1, h1.mainpageH1").first().text().trim();
  const titleMatch = /^\d+\s+(.+?)\s+Running status$/i.exec(h1);
  const trainName = titleMatch ? titleMatch[1].trim() : null;

  if (!h1 || $("#divRunStatus").length === 0) {
    return {
      success: false,
      trainNo,
      trainName: null,
      runDate: null,
      summary: null,
      position: null,
      stations: [],
      rake: [],
      notFound: true,
      message: `Couldn't find running status for train ${trainNo}. Double-check the train number and try again.`,
    };
  }

  // ---- summary box (table.RunStatusStn2) ----
  const summary: RunningStatusSummary = {
    platform: null,
    arrival: { scheduled: null, actual: null, delayMin: null },
    departure: { scheduled: null, actual: null, delayMin: null },
    nextStoppingStation: null,
    nextStationNonStop: null,
    lastUpdated: null,
    statusMessage: null,
  };

  let scheduledSeen = 0;
  let actExpSeen = 0;
  let delaySeen = 0;

  $("table.RunStatusStn2")
    .find("tr")
    .each((_, tr) => {
      const cells = $(tr).children("td").toArray();
      const texts = cells.map((td) => cellText($, td));
      if (cells.length === 1) {
        // colspan=3 freeform status message row
        if (texts[0]) summary.statusMessage = texts[0];
        return;
      }
      if (cells.length === 2) {
        const [label, value] = texts;
        if (/platform/i.test(label)) summary.platform = value || null;
        else if (/last update/i.test(label)) summary.lastUpdated = value || null;
        return;
      }
      if (cells.length === 3) {
        const [, label, value] = texts;
        if (/scheduled/i.test(label)) {
          scheduledSeen++;
          if (scheduledSeen === 1) summary.arrival.scheduled = value || null;
          else summary.departure.scheduled = value || null;
        } else if (/act\/?exp/i.test(label)) {
          actExpSeen++;
          if (actExpSeen === 1) summary.arrival.actual = value || null;
          else summary.departure.actual = value || null;
        } else if (/^delay$/i.test(label)) {
          delaySeen++;
          const min = parseDelayMin(value || "");
          if (delaySeen === 1) summary.arrival.delayMin = min;
          else summary.departure.delayMin = min;
        } else if (/next station \(nonstopping\)/i.test(label)) {
          summary.nextStationNonStop = value || null;
        } else if (/next station/i.test(label)) {
          summary.nextStoppingStation = value || null;
        }
      }
    });

  // ---- station-wise table (table.SpotTrain) ----
  const stations: RunningStatusStop[] = [];
  let position: RunningStatusPosition | null = null;
  let seenMarker = false;

  $("table.SpotTrain")
    .find("tr")
    .each((_, tr) => {
      const cls = $(tr).attr("class") || "";
      if (cls.includes("sticky")) return; // header row

      const hasMarker = $(tr).find("#divTrainImg").length > 0;
      const cells = $(tr).children("td").toArray();

      if (hasMarker) {
        seenMarker = true;
        const lastCell = cells[cells.length - 1];
        const raw = cellText($, lastCell);
        // The cell has two lines joined by <br/> ("Departed from X at HH:MM
        // DD-Mon" / "NEXT_STATION Nkm") — split on the tag before collapsing
        // whitespace, since once collapsed there's no reliable delimiter
        // between the two halves.
        const innerHtml = $(lastCell).html() || "";
        const parts = innerHtml
          .split(/<br\s*\/?>/i)
          .map((p) => cheerio.load(`<div>${p}</div>`)("div").text().replace(/\s+/g, " ").trim());
        const [line1, line2] = parts;
        const m = /Departed from\s+(.+?)\s+at\s+(.+)$/i.exec(line1 || "");
        const distM = /^(.+?)\s+(\d+)\s*km$/i.exec(line2 || "");
        position = {
          raw,
          afterStation: m ? m[1].replace(/\(.*?\)/, "").trim() : null,
          atTime: m ? m[2].trim() : null,
          towardsStation: distM ? distM[1].trim() : null,
          towardsDistanceKm: distM ? Number(distM[2]) : null,
        };
        return;
      }

      if (cells.length < 6) return;

      const arrText = cellText($, cells[0]);
      const arrDelayText = cellText($, cells[1]);
      const stationCell = cells[3];
      const bgCellStyle = $(cells[2]).attr("style") || "";
      const depDelayText = cellText($, cells[4]);
      const depText = cellText($, cells[5]);

      const stationRaw = cellText($, stationCell);
      // "C SHIVAJI MAH T Platform - 15" -> split station name from trailing platform note
      const platMatch = /^(.*?)\s*Platform\s*-?\s*(\S+)$/i.exec(stationRaw);
      const station = platMatch ? platMatch[1].trim() : stationRaw;
      const platform = platMatch ? platMatch[2].trim() : undefined;

      const isOrigin = /^first$/i.test(arrText);
      const isDestination = /^last$/i.test(depText);

      stations.push({
        station,
        platform,
        isOrigin,
        isDestination,
        arrival: isOrigin
          ? null
          : { time: arrText || null, delayed: isDelayedColor($(cells[0]).attr("style")) },
        departure: isDestination
          ? null
          : { time: depText || null, delayed: isDelayedColor($(cells[5]).attr("style")) },
        arrivalDelayMin: parseDelayMin(arrDelayText),
        departureDelayMin: parseDelayMin(depDelayText),
        major: bgCellStyle.includes("96ccff"),
        status: seenMarker ? "upcoming" : "departed",
      });
    });

  // Mark the station right after the marker (if any) as "current" isn't quite
  // right — the marker sits *between* stations — so instead the last
  // "departed" entry and first "upcoming" entry bracket the train's live
  // position; that's surfaced via `position` + station.status already.

  const runDateMatch = /(\d{1,2}-\w{3}(?:-\d{4})?)/.exec(summary.lastUpdated || summary.departure.scheduled || "");

  const rake = $(".divRakeMobile")
    .children("div")
    .toArray()
    .map((d) => cellText($, d))
    .filter(Boolean);

  return {
    success: true,
    trainNo,
    trainName,
    runDate: runDateMatch ? runDateMatch[1] : null,
    summary,
    position,
    stations,
    rake,
  };
}

function ua() {
  return new UserAgent().toString();
}

export async function fetchRunningStatus(trainNo: string, date?: string): Promise<RunningStatusResult> {
  // `date` (when given) is appended as a query param on a best-effort basis —
  // this could not be verified against a live response from this sandbox.
  const url = date
    ? `https://erail.in/train-running-status/${encodeURIComponent(trainNo)}?date=${encodeURIComponent(date)}`
    : `https://erail.in/train-running-status/${encodeURIComponent(trainNo)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": ua(),
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      success: false,
      trainNo,
      trainName: null,
      runDate: null,
      summary: null,
      position: null,
      stations: [],
      rake: [],
      message: `erail.in returned ${res.status} for train ${trainNo}.`,
    };
  }

  const html = await res.text();
  return parseRunningStatusHtml(html, trainNo);
}
