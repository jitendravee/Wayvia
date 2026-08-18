/**
 * Autocomplete lookup for the train search box: given a partial train
 * number or name, return candidate trains.
 *
 * erail.in exposes `data2.aspx?action=GetTrain&Data1=<query>` (seen used by
 * their own PNR page to resolve a train number to its name). This sandbox
 * has no network egress to erail.in, so the exact response shape could not
 * be confirmed — this parser is written defensively against a few plausible
 * shapes (JSON array, JSON object with a list field, or erail's usual
 * tilde-delimited text) and falls back to the small local curated list in
 * lib/trains.ts if the live call fails, times out, or returns something
 * unrecognized. That fallback also means the search box always works even
 * before this endpoint's real shape has been verified against production.
 */

import UserAgent from "user-agents";
import { searchLocalTrains, TrainSummary } from "../trains";

function ua() {
  return new UserAgent().toString();
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function fromJsonShape(json: unknown): TrainSummary[] | null {
  const arr = Array.isArray(json)
    ? json
    : json && typeof json === "object"
    ? (json as Record<string, unknown>).data ?? (json as Record<string, unknown>).trains ?? (json as Record<string, unknown>).Data
    : null;

  if (!Array.isArray(arr)) return null;

  const out: TrainSummary[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const trainNo = String(rec.train_no ?? rec.TrainNo ?? rec.trainNo ?? rec.Data1 ?? "").trim();
    const trainName = String(rec.train_name ?? rec.TrainName ?? rec.trainName ?? "").trim();
    if (!trainNo) continue;
    out.push({
      trainNo,
      trainName: trainName || "Unknown train",
      from: String(rec.from_stn_code ?? rec.FromStnCode ?? rec.from ?? ""),
      to: String(rec.to_stn_code ?? rec.ToStnCode ?? rec.to ?? ""),
    });
  }
  return out.length ? out : null;
}

function fromTildeShape(text: string): TrainSummary[] | null {
  // erail's other endpoints (see lib/erail/prettify.ts) use a
  // "~~~~~~~~"-separated, "~"-delimited pseudo-CSV. Best-effort mirror of
  // that pattern here in case GetTrain follows the same convention.
  if (!text.includes("~")) return null;
  const out: TrainSummary[] = [];
  const chunks = text.split("~~~~~~~~").filter(Boolean);
  for (const chunk of chunks) {
    const fields = chunk.split("~").filter(Boolean);
    if (fields.length < 2) continue;
    const trainNo = fields.find((f) => /^\d{4,5}$/.test(f));
    if (!trainNo) continue;
    const idx = fields.indexOf(trainNo);
    out.push({ trainNo, trainName: fields[idx + 1] ?? "Unknown train", from: "", to: "" });
  }
  return out.length ? out : null;
}

export async function searchTrainsLive(query: string): Promise<TrainSummary[]> {
  const url = `https://erail.in/data2.aspx?action=GetTrain&Data1=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": ua(), Accept: "*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  const text = await res.text();
  const json = tryParseJson(text);
  const fromJson = json !== null ? fromJsonShape(json) : null;
  return fromJson ?? fromTildeShape(text) ?? [];
}

/**
 * Combines the live erail lookup with the local curated list — local
 * results are used to fill the dropdown instantly and as a safety net,
 * live results (when they resolve, and in whatever shape they turn out to
 * really be) are merged in and deduplicated by train number.
 */
export async function searchTrains(query: string, limit = 8): Promise<TrainSummary[]> {
  const local = searchLocalTrains(query, limit);
  let live: TrainSummary[] = [];
  try {
    live = await searchTrainsLive(query);
  } catch {
    live = [];
  }

  const byNo = new Map<string, TrainSummary>();
  for (const t of [...live, ...local]) {
    if (!byNo.has(t.trainNo)) byNo.set(t.trainNo, t);
  }
  return Array.from(byNo.values()).slice(0, limit);
}
